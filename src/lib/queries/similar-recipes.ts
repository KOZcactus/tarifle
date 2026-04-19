/**
 * "Benzer tarifler" öneri motoru — rule-based, LLM'siz.
 *
 * Tarif detay sayfasının altına 6 kart'lık "Benzer tarifler" şeridi için
 * skorlama mantığı. Kullanıcı bir tarife geldiğinde sonraki tarifi
 * aynı sayfada keşfedebilsin diye. Ana sayfaya dönüp filtrelerle uğraşmak
 * zorunda kalmasın.
 *
 * Skorlama (deterministic, aynı tarif için hep aynı sonuç):
 *   +3   Aynı kategori (corbalar ↔ corbalar)
 *   +2   Aynı RecipeType (YEMEK/TATLI/ICECEK ...) — kategoriyi farklı olsa
 *        da "hamur-isleri → hamur tatlısı" tarzı sıçramalarda etki
 *   +1   Her ortak tag — max 5 tag olduğu için 5 puan üstü çıkmaz
 *   +0.5 Aynı difficulty
 *   +1.5 Aynı cuisine (Japon tarifi okurken diğer Japon tarifleri öne)
 *   +1   Her ortak "önemli" malzeme (cap +3) — pantry ingredient'ler
 *        (tuz, biber, yağ, su vb.) exclude edilir, ana protein ve
 *        karakter malzemeleri sayılır. 1501 tarif ölçeğinde ingredient
 *        sinyali artık anlamlı (motor ilk yazıldığında 106 tarif vardı
 *        — pantry şişmesi sorun idi; şimdi scale yeterli).
 *   +0.3 isFeatured bonus (editör seçimi benzer tarifleri ufak boost —
 *        kullanıcıya kürasyonlu içerik hissiyatı)
 *
 * Tie-break: daha yeni tarif öne, sonra alfabetik (TR collation).
 *
 * Neden `ts_rank_cd` / FTS kullanmadım: FTS "bu kelimeyi arayan için"
 * relevance ölçüyor; burada amaç "bu tarife benzeyen" — tamamen farklı
 * problem. Skorlama metadata üzerinden daha doğal.
 */
import { prisma } from "@/lib/prisma";
import type { RecipeCard } from "@/types/recipe";

/**
 * Pantry / common ingredient blacklist — ingredient Jaccard skoru
 * hesaplanırken bu malzemeler sayılmaz. Herkes tuz, yağ, su kullanır;
 * gerçek benzerlik sinyalini boğarlar. Normalized ingredient name
 * (lowercased, TR accents preserved) karşılaştırılır. Liste sabit tutulur
 * — yeni pantry item gelirse burada ekle.
 */
const PANTRY_INGREDIENTS: ReadonlySet<string> = new Set([
  "tuz",
  "karabiber",
  "biber",
  "su",
  "yağ",
  "zeytinyağı",
  "sıvı yağ",
  "ayçiçek yağı",
  "şeker",
  "toz şeker",
  "pudra şekeri",
  "un",
  "maya",
  "kabartma tozu",
  "vanilya",
  "karbonat",
]);

/** Ingredient ismini normalize et: lowercase + TR collation için
 *  minimum müdahale (i→i, ı→ı preserved). Pantry lookup için yeterli. */
export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Pantry filter uygulanmış anlamlı ingredient list. */
export function filterSignalIngredients(names: readonly string[]): string[] {
  return names
    .map(normalizeIngredientName)
    .filter((n) => n.length > 0 && !PANTRY_INGREDIENTS.has(n));
}

export interface SimilarTarget {
  id: string;
  categoryId: string;
  type: string;
  difficulty: string;
  cuisine: string | null;
  tagSlugs: string[];
  /** Raw ingredient names — pantry filter `scoreCandidates` içinde
   *  uygulanır, caller normalize etmek zorunda değil. */
  ingredientNames: string[];
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
    cuisine: string | null;
    createdAt: Date;
    tagSlugs: string[];
    /** Raw ingredient names — scoring içinde pantry filter uygulanır. */
    ingredientNames?: readonly string[];
    /** Editör Seçimi flag'i — varsa küçük bir boost. */
    isFeatured?: boolean;
  }[],
): ScoredCandidate[] {
  const targetTags = new Set(target.tagSlugs);
  const targetSignalIngredients = new Set(
    filterSignalIngredients(target.ingredientNames),
  );

  const scored = candidates
    .filter((c) => c.id !== target.id)
    .map((c) => {
      let score = 0;
      if (c.categoryId === target.categoryId) score += 3;
      if (c.type === target.type) score += 2;
      if (c.difficulty === target.difficulty) score += 0.5;
      if (target.cuisine && c.cuisine === target.cuisine) score += 1.5;

      let sharedTags = 0;
      for (const t of c.tagSlugs) if (targetTags.has(t)) sharedTags++;
      score += sharedTags;

      // Ingredient overlap — pantry filter + cap @ +3. "Aynı ana
      // malzeme" sinyali metadata sinyaline karışmayacak şekilde
      // üstüne eklenir; kategori/tag zaten güçlü olduğu için ingredient
      // overlap tie-break gibi çalışır.
      if (c.ingredientNames && targetSignalIngredients.size > 0) {
        const candidateSignals = filterSignalIngredients(c.ingredientNames);
        let sharedIngredients = 0;
        for (const ing of candidateSignals) {
          if (targetSignalIngredients.has(ing)) sharedIngredients++;
        }
        score += Math.min(sharedIngredients, 3);
      }

      // Featured soft-boost — editör seçimi tarifleri aynı skordaki
      // sıradan tariflerin önüne geçer. Kürasyon kalitesini benzerlikle
      // birleştirir.
      if (c.isFeatured) score += 0.3;

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
      cuisine: true,
      tags: { select: { tag: { select: { slug: true } } } },
      ingredients: { select: { name: true } },
    },
  });
  if (!target) return [];

  const targetMeta: SimilarTarget = {
    id: target.id,
    categoryId: target.categoryId,
    type: target.type,
    difficulty: target.difficulty,
    cuisine: target.cuisine,
    tagSlugs: target.tags.map((t) => t.tag.slug),
    ingredientNames: target.ingredients.map((i) => i.name),
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
      ingredients: { select: { name: true } },
      _count: {
        select: { variations: { where: { status: "PUBLISHED" } } },
      },
    },
    // 100 row cap — 1501 tarif ölçeğinde 50 dardı, 100 candidate ile
    // ingredient overlap sinyali anlamlı çalışır. Scoring JS-side
    // O(n * avgIngredients) ≈ 100 × 10 = 1000 op, trivial.
    take: 100,
  });

  const scored = scoreCandidates(
    targetMeta,
    candidates.map((c) => ({
      id: c.id,
      title: c.title,
      categoryId: c.categoryId,
      type: c.type,
      difficulty: c.difficulty,
      cuisine: c.cuisine,
      createdAt: c.createdAt,
      tagSlugs: c.tags.map((t) => t.tag.slug),
      ingredientNames: c.ingredients.map((i) => i.name),
      isFeatured: c.isFeatured,
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
