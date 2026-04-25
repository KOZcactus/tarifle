import { unstable_cache } from "next/cache";
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

/**
 * Scoring helper for the "foryou" (kişiselleştirme tur 3) sort, ranks
 * recipes by how many of their tags intersect with the logged-in user's
 * `favoriteTags` preference. Pure function; unit-testable without DB.
 *
 * Returned score is the intersection count (0 when the user has no matching
 * tags, N when N tags align). Tie-break is Turkish-aware title ascending so
 * two recipes with the same boost score land in predictable alphabetic
 * order, matches the default "alphabetical" fallback ordering which the
 * user already expects when nothing else wins.
 *
 * NOT exported as a comparator because the fair implementation reads both
 * `score` values from a cached map; doing the set-intersect twice per
 * pairwise compare would blow the complexity up to O(n·m·log n).
 */
export function scoreByFavoriteTags(
  recipeTagSlugs: string[],
  favoriteTagSlugs: readonly string[],
): number {
  if (favoriteTagSlugs.length === 0 || recipeTagSlugs.length === 0) return 0;
  const favSet = new Set(favoriteTagSlugs);
  let score = 0;
  for (const slug of recipeTagSlugs) {
    if (favSet.has(slug)) score += 1;
  }
  return score;
}

/**
 * Comparator for the "foryou" sort. Takes a precomputed score map so the
 * intersect-and-count cost is paid once per recipe, not once per compare.
 *
 * Tie-break: Turkish-aware title asc, keeps the 0-score long tail (recipes
 * with no matching tags at all) in natural alphabetical order rather than
 * undefined DB ordering.
 */
export function compareByFavoriteBoost<T extends { id: string; title: string }>(
  scores: Map<string, number>,
  a: T,
  b: T,
): number {
  const aScore = scores.get(a.id) ?? 0;
  const bScore = scores.get(b.id) ?? 0;
  if (bScore !== aScore) return bScore - aScore;
  return a.title.localeCompare(b.title, "tr");
}

/**
 * Cuisine boost weight. Cuisine signal tag'den daha güçlü (kullanıcı bir
 * mutfak seçtiyse o mutfak tariflerinin önceliği yüksek olmalı). 2 puan
 * = ortalama 2 tag eşleşmesine denk.
 */
const CUISINE_BOOST_WEIGHT = 2;

/**
 * Combined preference score: tag-intersection + cuisine match. Pure
 * function. Cuisine eşleşmesi varsa +2, her tag eşleşmesi +1.
 */
export function scoreByFavoritePrefs(
  recipeTagSlugs: string[],
  recipeCuisine: string | null,
  favoriteTagSlugs: readonly string[],
  favoriteCuisines: readonly string[],
): number {
  const tagScore = scoreByFavoriteTags(recipeTagSlugs, favoriteTagSlugs);
  const cuisineScore =
    recipeCuisine && favoriteCuisines.includes(recipeCuisine)
      ? CUISINE_BOOST_WEIGHT
      : 0;
  return tagScore + cuisineScore;
}

// Ortak select, RecipeCard tipi için
const recipeCardSelect = {
  id: true,
  title: true,
  slug: true,
  emoji: true,
  difficulty: true,
  totalMinutes: true,
  servingCount: true,
  averageCalories: true,
  hungerBar: true,
  imageUrl: true,
  isFeatured: true,
  cuisine: true,
  category: {
    select: { name: true, slug: true, emoji: true },
  },
  _count: {
    // Card grids (home, kategoriler, tarifler list) read this, keep the
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
   * skipped, the caller has already decided which recipes match the
   * query via the full-text search layer (see `lib/search/recipe-search`).
   * The `query` field still controls `EmptyState` copy upstream but does
   * NOT add a `where.OR` here.
   */
  recipeIds?: string[];
  /**
   * Açlık barı minimum filtresi. Sadece `hungerBar >= hungerBarMin` olan
   * tarifler gösterilir. 1-10 arası integer; undefined = filtre yok.
   * URL'de `?tokluk-min=N`.
   */
  hungerBarMin?: number;
  sortBy?:
    | "newest"
    | "quickest"
    | "popular"
    | "alphabetical"
    | "most-variations"
    | "most-liked"
    | "most-filling"
    | "relevance"
    | "foryou";
  limit?: number;
  offset?: number;
  /**
   * Kişiselleştirme tur 3, user's `favoriteTags` slug list. Only consulted
   * when `sortBy === "foryou"`; otherwise ignored. Empty / undefined turns
   * the foryou branch into a plain alphabetical fallback (every recipe
   * scores 0 so the title tie-break wins), which keeps the API total-
   * ordered even when the caller forgot to gate on `hasFavoriteTags`.
   */
  boostTagSlugs?: string[];
  /**
   * Kişiselleştirme tur 4 (oturum 13), user's `favoriteCuisines` codes.
   * "foryou" sort'ta her cuisine eşleşmesi +CUISINE_BOOST_WEIGHT (2)
   * puan ekler (tag intersection +1, cuisine match daha güçlü sinyal).
   * boostTagSlugs ile birlikte ya da tek başına kullanılabilir.
   */
  boostCuisines?: string[];
}

/** Tarif listesi, arama, filtreleme ve sayfalama destekli.
 *
 *  Cache: 5 dk TTL + `revalidateTag("recipes")`. Admin recipe mutation
 *  (update/seed/delete) sonrası invalidate edilir. User-specific
 *  parametreler (`boostTagSlugs`, `sortBy: "foryou"`) farklı key entry'si
 *  yaratır, foryou mode her user için ayrı cache ama 5 dk içinde
 *  tekrar DB'ye gitmez. Public listing (`/kategoriler`, `/mutfak/*`,
 *  `/etiket/*`) en büyük kazancı alıyor: yüzlerce visitor → 12 DB
 *  hit/saat yerine 1500+ hit (5 dk TTL × saat).
 */
const _getRecipesInner = async (options: GetRecipesOptions = {}): Promise<{
  recipes: RecipeCard[];
  total: number;
}> => {
  const {
    query,
    difficulty,
    categorySlug,
    maxMinutes,
    tagSlugs,
    excludeAllergens,
    cuisines,
    recipeIds,
    hungerBarMin,
    sortBy = "alphabetical",
    limit = 24,
    offset = 0,
    boostTagSlugs,
    boostCuisines,
  } = options;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (recipeIds !== undefined) {
    // FTS layer already decided the candidate set. Zero results short-
    // circuit, `id: { in: [] }` in Prisma matches nothing, which is
    // what we want: an explicit empty search should return empty, not
    // fall through to the full catalog.
    where.id = { in: recipeIds };
  } else if (query) {
    // Legacy path, no FTS caller, fall back to contains OR. Used by
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

  if (hungerBarMin !== undefined && hungerBarMin >= 1 && hungerBarMin <= 10) {
    where.hungerBar = { gte: hungerBarMin };
  }

  if (excludeAllergens && excludeAllergens.length > 0) {
    // hasSome → true when the recipe has ANY of these allergens. We want
    // the opposite, exclude those recipes, so wrap in NOT.
    // Prisma's array filters: hasSome, hasEvery, has, isEmpty.
    where.NOT = {
      ...(where.NOT as object | undefined),
      allergens: { hasSome: excludeAllergens },
    };
  }

  // "foryou", kişiselleştirme tur 3. Filtered tarifleri tags ile çek, her
  // kayıt için favoriteTags ile kesişim sayısını hesapla, score desc + title
  // asc ile sort, slice. `most-liked` ile aynı pattern (orderBy ile ifade
  // edilemeyen aggregation mantığı JS'e taşınır); 1401 ölçeğinde filtered
  // sonuçlar genelde <300 tarif ve Prisma findMany bunu ms seviyesinde
  // getirir. Scale problemi varsa sonraki tur: User.favoriteTags JSONB
  // kolon + Postgres `array_length(overlap)` CTE veya denormalize boost
  // score.
  if (sortBy === "foryou") {
    const rows = await prisma.recipe.findMany({
      where,
      select: {
        ...recipeCardSelect,
        tags: {
          select: { tag: { select: { slug: true } } },
        },
      },
    });
    // Precompute score per recipe so the comparator stays O(1) per compare;
    // otherwise sort would pay the intersect cost O(n log n) times.
    // Tur 4 (oturum 13): cuisine boost dahil, tag intersection +1 +
    // cuisine match +CUISINE_BOOST_WEIGHT (2).
    const tagBoost = boostTagSlugs ?? [];
    const cuisineBoost = boostCuisines ?? [];
    const scoreMap = new Map<string, number>();
    for (const row of rows) {
      const slugs = row.tags.map((rt) => rt.tag.slug);
      scoreMap.set(
        row.id,
        scoreByFavoritePrefs(slugs, row.cuisine, tagBoost, cuisineBoost),
      );
    }
    const sorted = [...rows].sort((a, b) =>
      compareByFavoriteBoost(scoreMap, a, b),
    );
    const page = sorted.slice(offset, offset + limit).map((recipe) => {
      const { tags: _tags, ...card } = recipe;
      return card;
    });
    return {
      recipes: page as unknown as RecipeCard[],
      total: rows.length,
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

  // "relevance", yalnız FTS akışı anlam taşıyor. recipeIds dizi
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

  // Default is now alphabetical, feels natural for a browse page and
  // avoids clustering by recently-inserted seed batches (the old "newest"
  // default always pushed drinks to the top because their timestamps
  // happened to be last in the final seed run).
  //
  // "most-variations" siralamasi Prisma'nin orderBy._count'unu kullanir,
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
            : sortBy === "most-filling"
              ? // En tok tutandan başla; null hungerBar'lar Postgres'te
                // desc sıralamada sona düşer (nulls last default). Tie-break
                // title asc, kararlı sıralama için.
                [{ hungerBar: "desc" as const }, { title: "asc" as const }]
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
};

// Listing hot path (homepage, /tarifler, filter kombinasyonları).
// Session 11 tune: 5 dk → 10 dk. Kullanıcı tarama pattern'ı aynı
// filter'ı kısa sürede tekrarlamaz, uzun TTL Neon query'sini azaltır.
// Yeni tarif seed'i revalidateTag("recipes") ile invalidate edilir.
export const getRecipes = unstable_cache(_getRecipesInner, ["get-recipes-v1"], {
  // Oturum 12 tune: 10 dk -> 30 dk. Vercel Free tier Fluid Active CPU
  // %75 seviyesine cikinca agresif cache. Tarif listing'i nadiren
  // degisir; admin edit + seed invalidate "recipes" tag zaten tetikler.
  revalidate: 1800,
  tags: ["recipes"],
});

/** Öne çıkan tarifler */
/**
 * Öne çıkan tarifler, haftalık rotating pool.
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
 * açıyor, 7 gün aynı görmek tanıdıklık kuruyor, sonraki hafta yenilik.
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

/** Featured pool cache, 1 saat TTL. Featured set nadir değişir (Codex
 *  seed'de isFeatured:true flag + manuel admin toggle). Rotation math
 *  dışarıda tutuluyor çünkü `getWeekIndex()` server time'a bağlı + pool
 *  slug-ordered deterministic. */
const getFeaturedPool = unstable_cache(
  async () => {
    return prisma.recipe.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      select: recipeCardSelect,
      orderBy: { slug: "asc" },
    });
  },
  ["featured-pool-v2"],
  // Oturum 12 tune: 1 sa -> 6 sa. Featured set nadir degisir (admin
  // toggle + isFeatured seed). Uzun TTL Neon CU-seconds + Vercel
  // Fluid CPU'yu dramatik dusurur.
  { revalidate: 21600, tags: ["featured-pool"] },
);

export async function getFeaturedRecipes(limit = 6): Promise<RecipeCard[]> {
  const pool = await getFeaturedPool();

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
 * Son N günde eklenen tarifler, ana sayfadaki "Yeni eklenenler"
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

/** En çok görüntülenen tarifler, viewCount desc */
export async function getPopularRecipes(limit = 8): Promise<RecipeCard[]> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: recipeCardSelect,
    orderBy: { viewCount: "desc" },
    take: limit,
  });

  return recipes as unknown as RecipeCard[];
}

/** Kişiselleştirme tur 2, User.favoriteCuisines / favoriteTags /
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
 *   - Sorting: popular (viewCount desc), "ilgi göstermiş olduğun içerikten
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

/** Listing sayfaları için allergen-default-exclude helper, URL'de açık bir
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
    // User made a choice in the URL, don't second-guess it. Caller is
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

/** Kişiselleştirme tur 3, listing'de sıralama boost için kullanıcının
 *  favoriteTags slug listesini döndürür. Anonymous veya set etmemişse boş
 *  dizi. Ayrı bir lookup: allergen helper'ıyla birleştirmek istemedim çünkü
 *  allergen her listing sayfasında zorunlu (security default), favoriteTags
 *  sadece `/tarifler` sort mantığı için opsiyonel, iki concern karıştırsa
 *  caller tarafı karmaşıklaşır.
 *
 *  Kullanım: `/tarifler` logged-in user hiç `?siralama=` seçmediyse ve
 *  favoriteTags boş değilse → `sortBy="foryou"` + `boostTagSlugs=...`. */
export async function getUserFavoriteTagSlugs(
  userId: string | null | undefined,
): Promise<string[]> {
  if (!userId) return [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favoriteTags: true },
  });
  return user?.favoriteTags ?? [];
}

/** Kişiselleştirme tur 4 (oturum 13), user's `favoriteCuisines` codes
 *  ("tr", "it", "fr"...). Anonymous veya boş ise [] döner. /tarifler
 *  foryou sort cuisine boost için kullanır.
 */
export async function getUserFavoriteCuisines(
  userId: string | null | undefined,
): Promise<string[]> {
  if (!userId) return [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favoriteCuisines: true },
  });
  return user?.favoriteCuisines ?? [];
}

/** Tek tarif detayı, slug ile */
async function _getRecipeBySlugInner(slug: string): Promise<RecipeDetail | null> {
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
      isFeatured: true,
      tipNote: true,
      servingSuggestion: true,
      allergens: true,
      cuisine: true,
      hungerBar: true,
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
      // Faz 2 enrichment (oturum 20): RecipeNutrition 1:1, USDA bazli
      // per-porsiyon sugar / fiber / sodium / satFat. NutritionInfo
      // component bu degerleri ana macro grid'inin altinda render eder.
      nutrition: {
        select: {
          sugarPerServing: true,
          fiberPerServing: true,
          sodiumPerServing: true,
          satFatPerServing: true,
          matchedRatio: true,
        },
      },
      _count: {
        select: {
          // Only count what the public actually sees, HIDDEN/PENDING_REVIEW
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
  const n = recipe.nutrition;
  return {
    ...recipe,
    protein: recipe.protein ? Number(recipe.protein) : null,
    carbs: recipe.carbs ? Number(recipe.carbs) : null,
    fat: recipe.fat ? Number(recipe.fat) : null,
    nutrition: n
      ? {
          sugarPerServing: n.sugarPerServing ? Number(n.sugarPerServing) : null,
          fiberPerServing: n.fiberPerServing ? Number(n.fiberPerServing) : null,
          sodiumPerServing: n.sodiumPerServing ? Number(n.sodiumPerServing) : null,
          satFatPerServing: n.satFatPerServing ? Number(n.satFatPerServing) : null,
          matchedRatio: n.matchedRatio ? Number(n.matchedRatio) : null,
        }
      : null,
    createdAt: recipe.createdAt.toISOString(),
  } as RecipeDetail;
}

/**
 * Cached tek tarif detayı wrapper. /tarif/[slug] sayfası her ziyarette
 * ~7-9 Prisma subquery'si üretir (ingredients + steps + tags + variations +
 * _count relation subselects). Sentry N+1 alert'inin ana kaynağı. 5 dk TTL
 * ile çoğu tekil ziyarette Neon'a hiç gitmemesi sağlanır; "recipes" tag'i
 * mevcut mutasyon akışında zaten invalidate ediliyor (seed / admin edit /
 * view count güncellemesi dışında; viewCount zamanlamayı atlatır ama o
 * info-only metrik, stale OK).
 *
 * Revalidation: revalidateTag("recipes"). seed-recipes/scripts ve admin
 * hook'ları çağrıyor (bkz. src/app/api/admin/*).
 */
export const getRecipeBySlug = unstable_cache(
  _getRecipeBySlugInner,
  ["get-recipe-by-slug-v2"],
  {
    // Oturum 12 tune: 5 dk -> 30 dk. Tarif icerigi nadir degisir;
    // admin edit + seed "recipes" tag ile anlik invalidate. Uzun TTL
    // Vercel Fluid CPU tuketimini buyuk olcude dusurur.
    revalidate: 1800,
    tags: ["recipes"],
  },
);

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
