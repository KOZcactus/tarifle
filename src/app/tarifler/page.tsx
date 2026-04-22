import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { AllergenFilter } from "@/components/search/AllergenFilter";
import { DietFilter } from "@/components/search/DietFilter";
import { CuisineFilter } from "@/components/search/CuisineFilter";
import { Pagination } from "@/components/listing/Pagination";
import {
  CUISINE_CODES,
  CUISINE_LABEL,
  CUISINE_FLAG,
  CUISINE_SLUG,
  type CuisineCode,
} from "@/lib/cuisines";

// Alias, canonical redirect helper. CUISINE_SLUG doğrudan kullanılabilir;
// import'u local alias ile okunabilir tutmak yalnız generateMetadata
// bloğu içinde sembolik.
const CUISINE_SLUG_LOOKUP = CUISINE_SLUG;
import {
  getRecipes,
  getUserFavoriteTagSlugs,
  getUserFavoriteCuisines,
  resolveDefaultAllergenAvoidances,
} from "@/lib/queries/recipe";
import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/queries/category";
import { getTags } from "@/lib/queries/tag";
import { searchRecipeIds } from "@/lib/search/recipe-search";
import { logSearchQuery } from "@/lib/queries/search-log";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { ALLERGEN_ORDER } from "@/lib/allergens";
import { getSearchSuggestions } from "@/lib/queries/search-suggestions";
import type { Metadata } from "next";

export async function generateMetadata({ searchParams }: TariflerPageProps): Promise<Metadata> {
  const params = await searchParams;
  const rawCuisines = params.mutfak
    ? Array.isArray(params.mutfak) ? params.mutfak : [params.mutfak]
    : [];
  const cuisineLabels = rawCuisines
    .filter((c): c is CuisineCode => (CUISINE_CODES as readonly string[]).includes(c))
    .map((c) => CUISINE_LABEL[c]);

  const title = cuisineLabels.length > 0
    ? `${cuisineLabels.join(" & ")} Tarifleri`
    : "Tarifler";

  const description = cuisineLabels.length > 0
    ? `${cuisineLabels.join(" ve ")} mutfağından yemek, içecek ve kokteyl tariflerini keşfet.`
    : "Tüm yemek, içecek ve kokteyl tariflerini keşfet. Kategoriye, zorluğa ve süreye göre filtrele.";

  // Index policy:
  //   - Bare /tarifler → indexable (main listing landing)
  //   - /tarifler?mutfak=X → NOINDEX + canonical → /mutfak/<slug>. Path-based
  //     programatik landing artık canonical kaynak; query-string variant
  //     duplicate content olarak değerlendirilir.
  //   - Everything else parameterised → noindex,follow. User searches
  //     (`?q=`), sort orders, allergen combos, and multi-filter URLs are
  //     crawl traps and leak user input into the index.
  const keys = Object.keys(params);
  const isSingleCuisineParam =
    keys.length === 1 && keys[0] === "mutfak" && rawCuisines.length === 1;
  const shouldIndex = keys.length === 0;

  // Cuisine query-string variant: canonical'i path-based /mutfak/<slug>'a
  // yönlendir. `CUISINE_SLUG` map cuisines.ts'de yaşar. Import ufak bir
  // circular-risk taşır ama burada top-level helper olduğu için sorun yok.
  const canonical = isSingleCuisineParam
    ? `/mutfak/${CUISINE_SLUG_LOOKUP[rawCuisines[0] as CuisineCode]}`
    : "/tarifler";

  return {
    title,
    description,
    alternates: { canonical },
    robots: shouldIndex ? undefined : { index: false, follow: true },
  };
}

interface TariflerPageProps {
  searchParams: Promise<{
    q?: string;
    zorluk?: string;
    kategori?: string;
    sure?: string;
    siralama?: string;
    etiket?: string | string[];
    alerjen?: string | string[];
    mutfak?: string | string[];
    /** Açlık barı minimum filtresi, 1-10 integer (porsiyon başı tokluk). */
    "tokluk-min"?: string;
    page?: string;
  }>;
}

export default async function TariflerPage({ searchParams }: TariflerPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const difficulty = params.zorluk ?? "";
  const category = params.kategori ?? "";
  const maxMinutes = params.sure ? parseInt(params.sure, 10) : undefined;
  // "alphabetical" is the default when nothing is passed. Explicit typing
  // so an unknown ?siralama= value doesn't sneak through; we fall back to
  // undefined and let getRecipes apply its default.
  const allowedSorts = [
    "alphabetical",
    "newest",
    "popular",
    "quickest",
    "most-variations",
    "most-liked",
    "most-filling",
    "relevance",
    "foryou",
  ] as const;
  type SortOption = (typeof allowedSorts)[number];
  const sortBy: SortOption | undefined = allowedSorts.includes(
    (params.siralama ?? "") as SortOption,
  )
    ? (params.siralama as SortOption)
    : undefined;
  const tagSlugs = params.etiket
    ? Array.isArray(params.etiket)
      ? params.etiket
      : [params.etiket]
    : undefined;

  // Parse + validate allergen exclusion list. Unknown enum values are
  // dropped silently so a mistyped URL doesn't 500, just ignores the
  // unknown one and filters by whatever else was valid.
  //
  // Kullanıcı URL'de açık bir ?alerjen= seçimi yapmadıysa, logged-in
  // user'ın User.allergenAvoidances tercihini default olarak uygula
  // (güvenlik, kullanıcı kendi profilinde kaçındığı alerjen işaretledi
  // diye biz de listing'de ona göre filtre çekiyoruz). URL'de seçim varsa
  // override.
  const rawAllergens = params.alerjen
    ? Array.isArray(params.alerjen)
      ? params.alerjen
      : [params.alerjen]
    : [];
  const urlExcludeAllergens = rawAllergens.filter(
    (a): a is (typeof ALLERGEN_ORDER)[number] =>
      (ALLERGEN_ORDER as readonly string[]).includes(a),
  );
  const session = await auth();
  const [excludeAllergens, favoriteTagSlugs, favoriteCuisines] = await Promise.all([
    resolveDefaultAllergenAvoidances({
      userId: session?.user?.id ?? null,
      explicitAllergens: urlExcludeAllergens,
    }),
    getUserFavoriteTagSlugs(session?.user?.id ?? null),
    getUserFavoriteCuisines(session?.user?.id ?? null),
  ]);

  // Default sort picks, in order:
  //   1) URL'de explicit `?siralama=` varsa → kullanıcı bilerek seçmiş, saygı duy.
  //   2) Query (FTS) varsa → `relevance` (ranked search results).
  //   3) Logged-in user'ın `favoriteTags` veya `favoriteCuisines` tercihi
  //      doluysa → `foryou` (kişiselleştirme tur 4, user'ın tag + cuisine
  //      sinyaline göre boost).
  //   4) Diğer tüm durumlarda → `alphabetical` (catalog browse default).
  const hasPersonalizationSignal =
    favoriteTagSlugs.length > 0 || favoriteCuisines.length > 0;
  const activeSort: SortOption =
    sortBy ??
    (query
      ? "relevance"
      : hasPersonalizationSignal
        ? "foryou"
        : "alphabetical");

  // Parse + validate cuisine inclusion list. Unknown codes are dropped
  // silently so a mistyped URL doesn't 500.
  const rawCuisines = params.mutfak
    ? Array.isArray(params.mutfak)
      ? params.mutfak
      : [params.mutfak]
    : [];
  const cuisines = rawCuisines.filter((c): c is CuisineCode =>
    (CUISINE_CODES as readonly string[]).includes(c),
  );

  // Açlık barı minimum parse. Geçersiz veya out-of-range değerler sessizce
  // düşürülür (getRecipes tarafında da clamp var ama URL level'da da temizle).
  const rawHungerMin = params["tokluk-min"];
  const hungerBarMin = rawHungerMin
    ? Math.max(1, Math.min(10, parseInt(rawHungerMin, 10) || 0)) || undefined
    : undefined;

  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // FTS layer: resolve the query to a ranked set of candidate IDs first
  // so the downstream Prisma filter chain (category/difficulty/tags/
  // allergens) only runs over the relevant subset. When no query is
  // present we skip this entirely and let getRecipes do its plain
  // listing (catalog browse mode).
  const rankedIds = query
    ? (await searchRecipeIds({ query })).map((r) => r.id)
    : undefined;

  const [{ recipes, total }, categories, tags, searchSuggestions, t] = await Promise.all([
    getRecipes({
      query: query || undefined,
      difficulty: difficulty || undefined,
      categorySlug: category || undefined,
      maxMinutes,
      tagSlugs,
      excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined,
      cuisines: cuisines.length > 0 ? cuisines : undefined,
      recipeIds: rankedIds,
      hungerBarMin,
      sortBy: activeSort,
      boostTagSlugs:
        activeSort === "foryou" && favoriteTagSlugs.length > 0
          ? favoriteTagSlugs
          : undefined,
      boostCuisines:
        activeSort === "foryou" && favoriteCuisines.length > 0
          ? favoriteCuisines
          : undefined,
      limit: ITEMS_PER_PAGE,
      offset,
    }),
    getCategories(),
    getTags(),
    getSearchSuggestions(),
    getTranslations("recipes"),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Search log: query varsa ve ilk sayfa ise (pagination-1 = yeniden log
  // yazmayalım, aynı arama 5 sayfa → 5 kayıt). Fire-and-forget; insert
  // DB'ye her başarısız olursa listing akışını engellemez.
  if (query && currentPage === 1) {
    logSearchQuery(query, total, session?.user?.id ?? null).catch((err) => {
      console.error("[search-log] insert failed:", err);
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-2 text-text-muted">{t("totalFound", { total })}</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <Suspense>
          <SearchBar suggestions={searchSuggestions} />
        </Suspense>
        <Suspense>
          <FilterPanel categories={categories} tags={tags} />
        </Suspense>
        <Suspense>
          <AllergenFilter selected={excludeAllergens} />
        </Suspense>
        <Suspense>
          <DietFilter activeTagSlugs={tagSlugs ?? []} />
        </Suspense>
        <Suspense>
          <CuisineFilter selected={cuisines} />
        </Suspense>
      </div>

      {/* Active filter summary chips */}
      <ActiveFilters
        query={query}
        category={category}
        difficulty={difficulty}
        maxMinutes={maxMinutes}
        cuisines={cuisines}
        excludeAllergens={excludeAllergens}
        tagSlugs={tagSlugs}
        params={params}
        t={t}
      />

      {/* Sort tabs, rewrites ?siralama=... while preserving every other
          filter in the URL. Default (alphabetical) omits the param so the
          canonical URL is clean. */}
      <div className="mb-6 flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-2 text-xs uppercase tracking-wide text-text-muted">
          {t("sortLabel")}
        </span>
        {[
          // Relevance chip shows up only when there is an active query;
          // ekranı boş aramada kirletmeyelim.
          ...(query
            ? [{ key: "relevance", label: t("sort.relevance") } as const]
            : []),
          // "Sana göre" chip, yalnız logged-in user favoriteTags VEYA
          // favoriteCuisines set ettiyse görünür. Anonim user için
          // tamamen gizli: dropdown'u yemleyen login duvarı gereksiz.
          ...(!query && hasPersonalizationSignal
            ? [{ key: "foryou", label: t("sort.foryou") } as const]
            : []),
          { key: "alphabetical", label: t("sort.alphabetical") } as const,
          { key: "newest", label: t("sort.newest") } as const,
          { key: "popular", label: t("sort.popular") } as const,
          { key: "quickest", label: t("sort.quickest") } as const,
          { key: "most-variations", label: t("sort.mostVariations") } as const,
          { key: "most-liked", label: t("sort.mostLiked") } as const,
          { key: "most-filling", label: t("sort.mostFilling") } as const,
        ].map(({ key, label }) => {
          const isActive = key === activeSort;
          const search = new URLSearchParams();
          for (const [k, v] of Object.entries(params)) {
            if (!v || k === "siralama" || k === "page") continue;
            if (Array.isArray(v)) v.forEach((item) => search.append(k, item));
            else search.set(k, v);
          }
          // Canonical URL için default sort param'ını çıkar. Default sırası:
          //   query varsa "relevance", favoriteTags veya favoriteCuisines
          //   doluysa "foryou", aksi halde "alphabetical". Default olan key
          //   URL'ye yazılmaz; kullanıcı başka bir seçim yaptığında o key
          //   URL'ye eklenir.
          const defaultKey = query
            ? "relevance"
            : hasPersonalizationSignal
              ? "foryou"
              : "alphabetical";
          const isDefaultForContext = key === defaultKey;
          if (!isDefaultForContext) search.set("siralama", key);
          const qs = search.toString();
          const href = `/tarifler${qs ? `?${qs}` : ""}`;
          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                isActive
                  ? "bg-bg-card font-medium text-text"
                  : "text-text-muted hover:bg-bg-card"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Results */}
      {recipes.length > 0 ? (
        <>
          {/* Heading hierarchy fix, h1 (page title) → h2 (sr-only) →
              h3 (RecipeCard inside). Lighthouse heading-order best-
              practice violation gideriyor; ekran okuyucu için anlamlı,
              görsel kullanıcıya etkisi yok. */}
          <h2 className="sr-only">{t("listAria")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              basePath="/tarifler"
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={params}
              t={t}
              totalItems={total}
              pageSize={ITEMS_PER_PAGE}
            />
          )}
        </>
      ) : (
        <EmptyState
          query={query}
          hasFilters={!!(category || difficulty || maxMinutes || (tagSlugs && tagSlugs.length > 0) || excludeAllergens.length > 0 || cuisines.length > 0)}
          cuisineCount={cuisines.length}
          allergenCount={excludeAllergens.length}
          t={t}
        />
      )}
    </div>
  );
}

type RecipesTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

function EmptyState({
  query,
  hasFilters,
  cuisineCount,
  allergenCount,
  t,
}: {
  query: string;
  hasFilters: boolean;
  cuisineCount: number;
  allergenCount: number;
  t: RecipesTranslator;
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="text-5xl">🔍</span>
      <h2 className="mt-4 font-heading text-xl font-semibold">{t("empty.title")}</h2>
      <p className="mt-2 text-sm text-text-muted">
        {query
          ? t("empty.queryMessage", { query })
          : t("empty.filtersMessage")}
      </p>

      {/* Suggestions */}
      {(hasFilters || query) && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("empty.tryHeader")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {query && (
              <Link
                href="/tarifler"
                className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {t("empty.clearSearch")}
              </Link>
            )}
            {hasFilters && (
              <Link
                href={query ? `/tarifler?q=${encodeURIComponent(query)}` : "/tarifler"}
                className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {t("empty.removeAllFilters")}
              </Link>
            )}
            {cuisineCount > 0 && (
              <Link
                href="/tarifler"
                className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {t("empty.showAllCuisines")}
              </Link>
            )}
            {allergenCount > 0 && (
              <Link
                href="/tarifler"
                className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {t("empty.removeAllergenFilter")}
              </Link>
            )}
            <Link
              href="/ai-asistan"
              className="rounded-full border border-accent-blue/30 bg-accent-blue/5 px-3 py-1.5 text-xs text-accent-blue transition-colors hover:border-accent-blue hover:bg-accent-blue/10"
            >
              {t("empty.aiAssistantTry")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** Active filter summary, shows which filters are active with remove buttons. */
async function ActiveFilters({
  query,
  category,
  difficulty,
  maxMinutes,
  cuisines,
  excludeAllergens,
  tagSlugs,
  params,
}: {
  query: string;
  category: string;
  difficulty: string;
  maxMinutes: number | undefined;
  cuisines: string[];
  excludeAllergens: string[];
  tagSlugs: string[] | undefined;
  params: Record<string, string | string[] | undefined>;
  t: RecipesTranslator;
}) {
  const tFilters = await getTranslations("filters");
  const tCard = await getTranslations("recipes.card");
  const tCuisine = await getTranslations("cuisines");
  const tAllergen = await getTranslations("allergens");
  const chips: { label: string; removeParam: string; removeValue?: string }[] = [];

  if (query) chips.push({ label: `"${query}"`, removeParam: "q" });
  if (category) {
    chips.push({
      label: tFilters("category.chipPrefix", { label: category }),
      removeParam: "kategori",
    });
  }
  if (difficulty) {
    const key =
      difficulty === "EASY"
        ? "difficultyEasy"
        : difficulty === "MEDIUM"
          ? "difficultyMedium"
          : "difficultyHard";
    chips.push({ label: tCard(key), removeParam: "zorluk" });
  }
  if (maxMinutes) {
    chips.push({
      label: tFilters("time.chipMax", { n: maxMinutes }),
      removeParam: "sure",
    });
  }
  for (const c of cuisines) {
    const code = c as CuisineCode;
    const flag = CUISINE_FLAG[code] ?? "";
    const label = tCuisine.has(code) ? tCuisine(code) : code;
    chips.push({
      label: `${flag} ${label}`.trim(),
      removeParam: "mutfak",
      removeValue: c,
    });
  }
  for (const a of excludeAllergens) {
    const allergenLabel = tAllergen.has(a) ? tAllergen(a) : a;
    chips.push({
      label: tFilters("excludedSuffix", { label: allergenLabel }),
      removeParam: "alerjen",
      removeValue: a,
    });
  }
  if (tagSlugs) {
    for (const tag of tagSlugs) {
      chips.push({ label: `#${tag}`, removeParam: "etiket", removeValue: tag });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-text-muted">{tFilters("activeLabel")}</span>
      {chips.map((chip, i) => {
        const p = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (!v || k === "page") continue;
          if (Array.isArray(v)) {
            for (const item of v) {
              if (k === chip.removeParam && item === chip.removeValue) continue;
              p.append(k, item);
            }
          } else {
            if (k === chip.removeParam && (!chip.removeValue || v === chip.removeValue)) continue;
            p.set(k, v);
          }
        }
        const qs = p.toString();
        const href = `/tarifler${qs ? `?${qs}` : ""}`;

        return (
          <Link
            key={`${chip.removeParam}-${chip.removeValue ?? i}`}
            href={href}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            title={tFilters("removeChipTitle", { label: chip.label })}
          >
            {chip.label}
            <span aria-hidden="true">×</span>
          </Link>
        );
      })}
      <Link
        href="/tarifler"
        className="text-[11px] text-text-muted hover:text-primary"
      >
        {tFilters("clearAll")}
      </Link>
    </div>
  );
}
