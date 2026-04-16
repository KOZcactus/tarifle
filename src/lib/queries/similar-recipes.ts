/**
 * "Benzer tarifler" öneri motoru — rule-based, LLM'siz.
 *
 * Tarif detay sayfasının altına 6 kart'lık "Benzer tarifler" şeridi için
 * skorlama mantığı. Kullanıcı bir tarife geldiğinde sonraki tarifi
 * aynı sayfada keşfedebilsin diye. Ana sayfaya dönüp filtrelerle uğraşmak
 * zorunda kalmasın.
 *
 * Skorlama (deterministic, aynı tarif için hep aynı sonuç):
 *   +3  Aynı kategori (corbalar ↔ corbalar)
 *   +2  Aynı RecipeType (YEMEK/TATLI/ICECEK ...) — kategoriyi farklı olsa
 *       da "hamur-isleri → hamur tatlısı" tarzı sıçramalarda etki
 *   +1  Her ortak tag — max 5 tag olduğu için 5 puan üstü çıkmaz
 *   +0.5 Aynı difficulty
 *
 * Tie-break: daha yeni tarif öne, sonra alfabetik (TR collation).
 *
 * Neden Jaccard ingredient similarity eklemedim: 106 tarif ölçeğinde
 * ingredient listesi genelde "tuz, karabiber, yağ" gibi pantry'yle
 * şişiyor — gerçek benzerlik sinyali zayıf. Kategori + tag zaten anlamlı
 * sinyal. 500+ tarife çıktığında ingredient similarity + pantry filtresi
 * ikinci katmana eklenebilir.
 *
 * Neden `ts_rank_cd` / FTS kullanmadım: FTS "bu kelimeyi arayan için"
 * relevance ölçüyor; burada amaç "bu tarife benzeyen" — tamamen farklı
 * problem. Skorlama metadata üzerinden daha doğal.
 */
import { prisma } from "@/lib/prisma";
import type { RecipeCard } from "@/types/recipe";

export interface SimilarTarget {
  id: string;
  categoryId: string;
  type: string;
  difficulty: string;
  tagSlugs: string[];
}

export interface ScoredCandidate {
  id: string;
  score: number;
  title: string;
}

/**
 * Core scoring function — no DB, no I/O. Extracted so unit tests can
 * exercise the rule matrix without a live Postgres. The caller feeds
 * target's metadata + candidate rows; this assigns scores.
 *
 * Exported for tests. Returns candidates sorted by score desc, then
 * newest, then title asc (TR collation).
 */
export function scoreCandidates(
  target: SimilarTarget,
  candidates: readonly {
    id: string;
    title: string;
    categoryId: string;
    type: string;
    difficulty: string;
    createdAt: Date;
    tagSlugs: string[];
  }[],
): ScoredCandidate[] {
  const targetTags = new Set(target.tagSlugs);

  const scored = candidates
    .filter((c) => c.id !== target.id)
    .map((c) => {
      let score = 0;
      if (c.categoryId === target.categoryId) score += 3;
      if (c.type === target.type) score += 2;
      if (c.difficulty === target.difficulty) score += 0.5;

      let sharedTags = 0;
      for (const t of c.tagSlugs) if (targetTags.has(t)) sharedTags++;
      score += sharedTags;

      return { ...c, score };
    });

  // Drop candidates with score 0 — they have NO signal (different
  // category, type, and no shared tags). Showing them would be noise.
  const signal = scored.filter((c) => c.score > 0);

  signal.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const bt = b.createdAt.getTime();
    const at = a.createdAt.getTime();
    if (bt !== at) return bt - at;
    return a.title.localeCompare(b.title, "tr");
  });

  return signal.map((c) => ({ id: c.id, score: c.score, title: c.title }));
}

/**
 * DB-backed "benzer tarifler" pipeline. Two-step:
 *   1. Load target's metadata (category, type, difficulty, tags).
 *   2. Load candidate pool (same category OR same type), score them,
 *      hydrate the top N as full RecipeCard for the UI.
 *
 * Candidate pool is deliberately widened to "same category OR same
 * type" so TATLI recipes in non-tatlilar categories (e.g. hamur-isleri
 * with type=TATLI) still find each other.
 *
 * Returns empty array if the target doesn't exist or has no signal
 * matches. UI component handles the empty state by hiding the section.
 */
export async function getSimilarRecipes(
  recipeId: string,
  limit = 6,
): Promise<RecipeCard[]> {
  const target = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      categoryId: true,
      type: true,
      difficulty: true,
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });
  if (!target) return [];

  const targetMeta: SimilarTarget = {
    id: target.id,
    categoryId: target.categoryId,
    type: target.type,
    difficulty: target.difficulty,
    tagSlugs: target.tags.map((t) => t.tag.slug),
  };

  // Pool: same category OR same type, PUBLISHED, excluding self. Pull
  // the metadata needed for scoring + enough RecipeCard fields so we
  // can hydrate without a second round-trip.
  const candidates = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: recipeId },
      OR: [
        { categoryId: target.categoryId },
        { type: target.type },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      emoji: true,
      difficulty: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      imageUrl: true,
      isFeatured: true,
      cuisine: true,
      categoryId: true,
      type: true,
      createdAt: true,
      category: {
        select: { name: true, slug: true, emoji: true },
      },
      tags: { select: { tag: { select: { slug: true } } } },
      _count: {
        select: { variations: { where: { status: "PUBLISHED" } } },
      },
    },
    // 50 row cap — scoring is O(n * avgTags) JS so small; the bigger
    // cost is SELECTing wide rows. 50 is plenty for a 6-card section
    // even once we have 500+ recipes.
    take: 50,
  });

  const scored = scoreCandidates(
    targetMeta,
    candidates.map((c) => ({
      id: c.id,
      title: c.title,
      categoryId: c.categoryId,
      type: c.type,
      difficulty: c.difficulty,
      createdAt: c.createdAt,
      tagSlugs: c.tags.map((t) => t.tag.slug),
    })),
  );

  const topIds = new Set(scored.slice(0, limit).map((s) => s.id));
  const top = candidates.filter((c) => topIds.has(c.id));

  // Preserve the score-based order from `scored`.
  const orderByScore = new Map(
    scored.slice(0, limit).map((s, i) => [s.id, i]),
  );
  top.sort(
    (a, b) =>
      (orderByScore.get(a.id) ?? 0) - (orderByScore.get(b.id) ?? 0),
  );

  // Strip the scoring-only fields, return RecipeCard shape.
  return top.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    emoji: c.emoji,
    difficulty: c.difficulty,
    totalMinutes: c.totalMinutes,
    servingCount: c.servingCount,
    averageCalories: c.averageCalories,
    imageUrl: c.imageUrl,
    isFeatured: c.isFeatured,
    cuisine: c.cuisine,
    category: c.category,
    _count: { variations: c._count.variations },
  }));
}
