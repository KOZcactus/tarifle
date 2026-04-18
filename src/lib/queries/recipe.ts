import { prisma } from "@/lib/prisma";
import type { Allergen, Difficulty } from "@prisma/client";
import type { RecipeCard, RecipeDetail } from "@/types/recipe";

/**
 * Comparator used by the "most-liked" sort. Extracted as a pure function so
 * the aggregation rule has a regression guard without needing to stand up a
 * DB for the test. `variations` carries per-uyarlama likeCount; we return a
 * positive number when `b` should come before `a`.
 *
 * Tie-break: Turkish-aware title asc, so recipes with the same like total
 * (including the 0-liked long tail when the site is fresh) land in a
 * predictable alphabetic order rather than undefined DB ordering.
 */
export function compareByMostLiked<
  T extends { title: string; variations: { likeCount: number }[] },
>(a: T, b: T): number {
  const aTotal = a.variations.reduce((s, v) => s + v.likeCount, 0);
  const bTotal = b.variations.reduce((s, v) => s + v.likeCount, 0);
  if (bTotal !== aTotal) return bTotal - aTotal;
  return a.title.localeCompare(b.title, "tr");
}

// Ortak select — RecipeCard tipi için
const recipeCardSelect = {
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
  category: {
    select: { name: true, slug: true, emoji: true },
  },
  _count: {
    // Card grids (home, kategoriler, tarifler list) read this — keep the
    // public count consistent with what the user sees on the detail page.
    select: { variations: { where: { status: "PUBLISHED" } } },
  },
} as const;

interface GetRecipesOptions {
  query?: string;
  difficulty?: string;
  categorySlug?: string;
  maxMinutes?: number;
  tagSlugs?: string[];
  /**
   * Allergen exclusion filter. Recipes whose `allergens` array intersects
   * with this list are hidden. Empty/undefined = no filter.
   */
  excludeAllergens?: Allergen[];
  /**
   * Cuisine inclusion filter. Only recipes matching one of these cuisine
   * codes are shown. Empty/undefined = no filter (show all).
   */
  cuisines?: string[];
  /**
   * Restrict results to this set of IDs (in order of relevance). When
   * set, the legacy title/description/ingredient `contains` OR is
   * skipped — the caller has already decided which recipes match the
   * query via the full-text search layer (see `lib/search/recipe-search`).
   * The `query` field still controls `EmptyState` copy upstream but does
   * NOT add a `where.OR` here.
   */
  recipeIds?: string[];
  sortBy?:
    | "newest"
    | "quickest"
    | "popular"
    | "alphabetical"
    | "most-variations"
    | "most-liked"
    | "relevance";
  limit?: number;
  offset?: number;
}

/** Tarif listesi — arama, filtreleme ve sayfalama destekli */
export async function getRecipes(options: GetRecipesOptions = {}): Promise<{
  recipes: RecipeCard[];
  total: number;
}> {
  const {
    query,
    difficulty,
    categorySlug,
    maxMinutes,
    tagSlugs,
    excludeAllergens,
    cuisines,
    recipeIds,
    sortBy = "alphabetical",
    limit = 24,
    offset = 0,
  } = options;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (recipeIds !== undefined) {
    // FTS layer already decided the candidate set. Zero results short-
    // circuit — `id: { in: [] }` in Prisma matches nothing, which is
    // what we want: an explicit empty search should return empty, not
    // fall through to the full catalog.
    where.id = { in: recipeIds };
  } else if (query) {
    // Legacy path — no FTS caller, fall back to contains OR. Used by
    // any internal consumer that still calls getRecipes with a raw
    // query string (tests, ad-hoc scripts). The main /tarifler page
    // now goes through searchRecipeIds first.
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      {
        ingredients: {
          some: { name: { contains: query, mode: "insensitive" } },
        },
      },
    ];
  }

  if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
    where.difficulty = difficulty as Difficulty;
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (maxMinutes && maxMinutes > 0) {
    where.totalMinutes = { lte: maxMinutes };
  }

  if (tagSlugs && tagSlugs.length > 0) {
    where.tags = {
      some: { tag: { slug: { in: tagSlugs } } },
    };
  }

  if (cuisines && cuisines.length > 0) {
    where.cuisine = { in: cuisines };
  }

  if (excludeAllergens && excludeAllergens.length > 0) {
    // hasSome → true when the recipe has ANY of these allergens. We want
    // the opposite — exclude those recipes — so wrap in NOT.
    // Prisma's array filters: hasSome, hasEvery, has, isEmpty.
    where.NOT = {
      ...(where.NOT as object | undefined),
      allergens: { hasSome: excludeAllergens },
    };
  }

  // "most-liked" ayri bir yoldan gidiyor cunku Prisma orderBy iliskili bir
  // modeldeki kolonun SUM'unu dogrudan destekleyemiyor. Filtrelenmis tarifleri
  // uyarlamalarinin likeCount'u ile birlikte cekip JS'te topluyor, sirliyoruz.
  // 56-500 tarif olcegindeki proje icin tamamen yeterli; buyurse Recipe'e
  // denormalize edilmis bir `totalLikeCount` alani eklenip artirmalar
  // toggleLike'da yapilir.
  if (sortBy === "most-liked") {
    const rows = await prisma.recipe.findMany({
      where,
      select: {
        ...recipeCardSelect,
        variations: {
          where: { status: "PUBLISHED" },
          select: { likeCount: true },
        },
      },
    });
    const sorted = [...rows].sort(compareByMostLiked);
    const page = sorted.slice(offset, offset + limit).map((recipe) => {
      const {
        variations: _variations, // strip: was only loaded for aggregation
        ...card
      } = recipe;
      return card;
    });
    return {
      recipes: page as unknown as RecipeCard[],
      total: rows.length,
    };
  }

  // "relevance" — yalnız FTS akışı anlam taşıyor. recipeIds dizi
  // sırasını koruyacak şekilde sonuçları client-side yeniden diziyoruz
  // çünkü Postgres `ORDER BY ... IN (...)` tek SQL'de doğrudan olmuyor
  // ve 500 tarif ölçeğinde JS sort trivial.
  if (sortBy === "relevance" && recipeIds !== undefined) {
    const [rows, total] = await Promise.all([
      prisma.recipe.findMany({ where, select: recipeCardSelect }),
      prisma.recipe.count({ where }),
    ]);
    const rankByIndex = new Map(recipeIds.map((id, idx) => [id, idx]));
    const sorted = [...rows].sort((a, b) => {
      const ai = rankByIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bi = rankByIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
    return {
      recipes: sorted.slice(offset, offset + limit) as unknown as RecipeCard[],
      total,
    };
  }

  // Default is now alphabetical — feels natural for a browse page and
  // avoids clustering by recently-inserted seed batches (the old "newest"
  // default always pushed drinks to the top because their timestamps
  // happened to be last in the final seed run).
  //
  // "most-variations" siralamasi Prisma'nin orderBy._count'unu kullanir —
  // filtered where desteklemedigi icin HIDDEN/PENDING_REVIEW variation'lar
  // da siralamaya etki eder. Fark genelde kucuktur; modere edilmis tariflerde
  // PUBLISHED sayilari zaten birbirine yakin kalir.
  const orderBy =
    sortBy === "quickest"
      ? { totalMinutes: "asc" as const }
      : sortBy === "popular"
        ? { viewCount: "desc" as const }
        : sortBy === "newest"
          ? { createdAt: "desc" as const }
          : sortBy === "most-variations"
            ? { variations: { _count: "desc" as const } }
            : // alphabetical (default, relevance fallback w/o recipeIds)
              { title: "asc" as const };

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      select: recipeCardSelect,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.recipe.count({ where }),
  ]);

  return { recipes: recipes as unknown as RecipeCard[], total };
}

/** Öne çıkan tarifler */
/**
 * Öne çıkan tarifler — haftalık rotating pool.
 *
 * Önceki davranış: tüm `isFeatured=true` tarifleri `createdAt desc` ile
 * sıralayıp top N. Problem: 206 tarifte ~30-50 `isFeatured` olunca her
 * gün aynı 6'yı gördük, dönüp gelen kullanıcı için yorucu.
 *
 * Yeni davranış: pool'u slug-ordered sabit liste say, ISO haftasına
 * göre deterministic offset uygula, oradan N al. Bir hafta boyunca
 * aynı 6, ertesi hafta farklı 6. Wrap-around: (offset + i) % pool.length.
 * Pool küçükse (<= limit) tümü hep gösterilir; offset no-op olur.
 *
 * Neden haftalık (günlük yerine): tarifle.app ziyaretçisi zaman zaman
 * açıyor — 7 gün aynı görmek tanıdıklık kuruyor, sonraki hafta yenilik.
 * Günlük rotation çok agresif, "bu tarif nerede kayboldu" hissini verir.
 *
 * `getWeekIndex()` kontrol edilebilir bir saat kaynağı alır ki unit
 * test'te deterministic rotation'ı doğrulayabilelim.
 */
export function getWeekIndex(now: Date = new Date()): number {
  // 1970-01-01 Perşembe; UTC hafta indeksi. `Math.floor` her 7 günde bir
  // artar. Timezone shift'i başlangıç haftasını ±1 kaydırsa da rotation
  // çalışır.
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(now.getTime() / msPerWeek);
}

export async function getFeaturedRecipes(limit = 6): Promise<RecipeCard[]> {
  // Pool'u slug ordered olarak çek ki rotation offset her hafta
  // aynı sıra üzerinden yürüsün. `createdAt` ordered olsaydı yeni batch
  // eklenince mevcut rotation tamamen kayardı.
  const pool = await prisma.recipe.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    select: recipeCardSelect,
    orderBy: { slug: "asc" },
  });

  if (pool.length <= limit) {
    return pool as unknown as RecipeCard[];
  }

  const offset = getWeekIndex() % pool.length;
  const rotated: typeof pool = [];
  for (let i = 0; i < limit; i++) {
    const idx = (offset + i) % pool.length;
    const item = pool[idx];
    if (item) rotated.push(item);
  }
  return rotated as unknown as RecipeCard[];
}

/**
 * Son N günde eklenen tarifler — ana sayfadaki "Yeni eklenenler"
 * section için. Her batch sonrası (50-100 tarif) kullanıcıya yeni içerik
 * görünür olsun.
 *
 * `createdAt desc` ordering + `>= now - days` filter. 14 gün default:
 * Codex haftalık ~1-2 batch varsayımıyla genelde 50-200 tarif kapsar,
 * homepage'de 8 kart olarak gösteririz.
 */
export async function getRecentRecipes(
  days = 14,
  limit = 8,
): Promise<RecipeCard[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recipes = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      createdAt: { gte: since },
    },
    select: recipeCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return recipes as unknown as RecipeCard[];
}

/** 30 dakika altı hızlı tarifler */
export async function getQuickRecipes(limit = 8): Promise<RecipeCard[]> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED", totalMinutes: { lte: 30 } },
    select: recipeCardSelect,
    orderBy: { totalMinutes: "asc" },
    take: limit,
  });

  return recipes as unknown as RecipeCard[];
}

/** En çok görüntülenen tarifler — viewCount desc */
export async function getPopularRecipes(limit = 8): Promise<RecipeCard[]> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: recipeCardSelect,
    orderBy: { viewCount: "desc" },
    take: limit,
  });

  return recipes as unknown as RecipeCard[];
}

/** Kişiselleştirme tur 2 — User.favoriteCuisines / favoriteTags /
 *  allergenAvoidances alanlarını okuyup filtreleyerek tarif listesi döndürür.
 *
 *  Kullanım: homepage + /kesfet "Sana özel" shelf. Logged-in user en az bir
 *  tercih kaydettiyse ve o tercihlerle en az birkaç tarif eşleşiyorsa shelf
 *  render edilir; hasPrefs false veya recipes boşsa shelf hiç gösterilmez.
 *
 *  Filtering semantics:
 *   - cuisines + tagSlugs: AND (hem seçilen cuisine hem de seçilen etiket).
 *     Kullanıcı sadece cuisine seçtiyse o filtre yalnız çalışır; sadece tag
 *     seçtiyse o. İkisi de boşsa cuisine/tag filter yok, sadece allergen
 *     avoidance soft-fallback ile popular döner.
 *   - excludeAllergens: kullanıcı kaçındığı alerjenleri her durumda uygula
 *     (güvenlik).
 *   - Sorting: popular (viewCount desc) — "ilgi göstermiş olduğun içerikten
 *     en popülerini getir" intuition'ı. Sonraki turda personalized scoring. */
export async function getPersonalizedRecipes({
  userId,
  limit = 8,
}: {
  userId: string;
  limit?: number;
}): Promise<{ recipes: RecipeCard[]; hasPrefs: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      favoriteTags: true,
      favoriteCuisines: true,
      allergenAvoidances: true,
    },
  });
  if (!user) return { recipes: [], hasPrefs: false };

  const hasPrefs =
    user.favoriteCuisines.length > 0 ||
    user.favoriteTags.length > 0 ||
    user.allergenAvoidances.length > 0;
  if (!hasPrefs) return { recipes: [], hasPrefs: false };

  // Cuisine/tag bir filter olmadan popular-only çağrısı generic bir liste
  // olur; o kullanıcıya özel bir değer katmıyor. En az biri set olmalı ki
  // "sana özel" iddiası tutsun. allergenAvoidances tek başına yeterli kabul
  // etmiyoruz (o bir exclusion, positive signal değil).
  const hasPositiveSignal =
    user.favoriteCuisines.length > 0 || user.favoriteTags.length > 0;
  if (!hasPositiveSignal) return { recipes: [], hasPrefs: false };

  const { recipes } = await getRecipes({
    cuisines:
      user.favoriteCuisines.length > 0 ? user.favoriteCuisines : undefined,
    tagSlugs: user.favoriteTags.length > 0 ? user.favoriteTags : undefined,
    excludeAllergens:
      user.allergenAvoidances.length > 0
        ? user.allergenAvoidances
        : undefined,
    sortBy: "popular",
    limit,
  });
  return { recipes, hasPrefs: true };
}

/** Listing sayfaları için allergen-default-exclude helper — URL'de açık bir
 *  `?alerjen=` query yoksa kullanıcının `allergenAvoidances` tercihlerini
 *  default exclude olarak döndür. Kullanıcı URL'de manual seçim yaptıysa
 *  o override olur. Anonymous user veya preferences boşsa boş dizi.
 *
 *  İki ayrı listing sayfası (/tarifler + /tarifler/[kategori]) aynı mantığı
 *  paylaşsın diye ayrı export. */
export async function resolveDefaultAllergenAvoidances({
  userId,
  explicitAllergens,
}: {
  userId: string | null | undefined;
  explicitAllergens: string[];
}): Promise<Allergen[]> {
  if (explicitAllergens.length > 0) {
    // User made a choice in the URL — don't second-guess it. Caller is
    // responsible for validating the strings are Allergen values.
    return explicitAllergens as Allergen[];
  }
  if (!userId) return [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { allergenAvoidances: true },
  });
  return user?.allergenAvoidances ?? [];
}

/** Tek tarif detayı — slug ile */
export async function getRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      emoji: true,
      type: true,
      difficulty: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      imageUrl: true,
      videoUrl: true,
      status: true,
      viewCount: true,
      tipNote: true,
      servingSuggestion: true,
      allergens: true,
      cuisine: true,
      translations: true,
      createdAt: true,
      category: {
        select: { id: true, name: true, slug: true, emoji: true },
      },
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
          unit: true,
          sortOrder: true,
          isOptional: true,
          group: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: {
          id: true,
          stepNumber: true,
          instruction: true,
          tip: true,
          imageUrl: true,
          timerSeconds: true,
        },
        orderBy: { stepNumber: "asc" },
      },
      tags: {
        select: {
          tag: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      variations: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          miniTitle: true,
          description: true,
          // ingredients/steps/notes are needed by the new accordion in
          // VariationCard. Stored as JSON columns; the component coerces
          // back to string[] safely.
          ingredients: true,
          steps: true,
          notes: true,
          likeCount: true,
          // authorId is read on the page to decide whether to show the
          // owner's "Sil" button. Lower-risk than deriving ownership from
          // author.username because username can be changed, id cannot.
          authorId: true,
          createdAt: true,
          author: {
            select: { username: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { likeCount: "desc" },
      },
      _count: {
        select: {
          // Only count what the public actually sees — HIDDEN/PENDING_REVIEW
          // variations (or REJECTED, DRAFT) shouldn't inflate the badge on
          // the recipe page or in card grids.
          variations: { where: { status: "PUBLISHED" } },
          bookmarks: true,
          reviews: { where: { status: "PUBLISHED" } },
        },
      },
    },
  });

  if (!recipe || recipe.status !== "PUBLISHED") return null;

  // Decimal → number dönüşümü
  return {
    ...recipe,
    protein: recipe.protein ? Number(recipe.protein) : null,
    carbs: recipe.carbs ? Number(recipe.carbs) : null,
    fat: recipe.fat ? Number(recipe.fat) : null,
    createdAt: recipe.createdAt.toISOString(),
  } as RecipeDetail;
}

export interface RecipeReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { username: string; name: string | null; avatarUrl: string | null };
}

export interface RecipeReviewSummary {
  count: number;
  average: number; // 0-5, rounded to 1 decimal
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/**
 * Fetch all published reviews for a recipe + aggregate stats. Returns an
 * ordered list (newest first) plus the distribution histogram used by the
 * UI summary card ("★★★★☆ 4.2 · 127 yorum").
 */
export async function getRecipeReviews(
  recipeId: string,
): Promise<{ reviews: RecipeReview[]; summary: RecipeReviewSummary }> {
  const rows = await prisma.review.findMany({
    where: { recipeId, status: "PUBLISHED" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: {
        select: { username: true, name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };
  let sum = 0;
  for (const r of rows) {
    sum += r.rating;
    const bucket = r.rating as 1 | 2 | 3 | 4 | 5;
    if (bucket >= 1 && bucket <= 5) distribution[bucket]++;
  }
  const count = rows.length;
  const average = count === 0 ? 0 : Math.round((sum / count) * 10) / 10;

  return {
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      author: r.user,
    })),
    summary: { count, average, distribution },
  };
}

/** Fetch the caller's existing review on a recipe (if any). */
export async function getUserReviewForRecipe(
  userId: string,
  recipeId: string,
): Promise<{ id: string; rating: number; comment: string | null } | null> {
  const review = await prisma.review.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
    select: { id: true, rating: true, comment: true },
  });
  return review;
}

/** Görüntülenme sayısını artır (fire-and-forget) */
export async function incrementViewCount(slug: string): Promise<void> {
  await prisma.recipe.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  });
}
