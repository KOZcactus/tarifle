import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { AllergenFilter } from "@/components/search/AllergenFilter";
import { DietFilter } from "@/components/search/DietFilter";
import { CuisineFilter } from "@/components/search/CuisineFilter";
import { CUISINE_CODES, CUISINE_LABEL, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";
import { getRecipes } from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import { getTags } from "@/lib/queries/tag";
import { searchRecipeIds } from "@/lib/search/recipe-search";
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

  return {
    title,
    description,
    alternates: { canonical: "/tarifler" },
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
    "relevance",
  ] as const;
  type SortOption = (typeof allowedSorts)[number];
  const sortBy: SortOption | undefined = allowedSorts.includes(
    (params.siralama ?? "") as SortOption,
  )
    ? (params.siralama as SortOption)
    : undefined;
  // Default sort picks relevance when there's an active query (FTS ranked
  // results should win over alphabetical), otherwise alphabetical.
  const activeSort: SortOption =
    sortBy ?? (query ? "relevance" : "alphabetical");
  const tagSlugs = params.etiket
    ? Array.isArray(params.etiket)
      ? params.etiket
      : [params.etiket]
    : undefined;

  // Parse + validate allergen exclusion list. Unknown enum values are
  // dropped silently so a mistyped URL doesn't 500 — just ignores the
  // unknown one and filters by whatever else was valid.
  const rawAllergens = params.alerjen
    ? Array.isArray(params.alerjen)
      ? params.alerjen
      : [params.alerjen]
    : [];
  const excludeAllergens = rawAllergens.filter((a): a is (typeof ALLERGEN_ORDER)[number] =>
    (ALLERGEN_ORDER as readonly string[]).includes(a),
  );

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
      sortBy: activeSort,
      limit: ITEMS_PER_PAGE,
      offset,
    }),
    getCategories(),
    getTags(),
    getSearchSuggestions(),
    getTranslations("recipes"),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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

      {/* Sort tabs — rewrites ?siralama=... while preserving every other
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
          { key: "alphabetical", label: t("sort.alphabetical") } as const,
          { key: "newest", label: t("sort.newest") } as const,
          { key: "popular", label: t("sort.popular") } as const,
          { key: "quickest", label: t("sort.quickest") } as const,
          { key: "most-variations", label: t("sort.mostVariations") } as const,
          { key: "most-liked", label: t("sort.mostLiked") } as const,
        ].map(({ key, label }) => {
          const isActive = key === activeSort;
          const search = new URLSearchParams();
          for (const [k, v] of Object.entries(params)) {
            if (!v || k === "siralama" || k === "page") continue;
            if (Array.isArray(v)) v.forEach((item) => search.append(k, item));
            else search.set(k, v);
          }
          // Canonical URL için default sort param'ını çıkar.
          // Query varsa default "relevance", yoksa "alphabetical".
          const isDefaultForContext = query
            ? key === "relevance"
            : key === "alphabetical";
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
          {/* Heading hierarchy fix — h1 (page title) → h2 (sr-only) →
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
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={params}
              t={t}
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

function Pagination({
  currentPage,
  totalPages,
  searchParams,
  t,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
  t: RecipesTranslator;
}) {
  function buildPageUrl(page: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (!value || key === "page") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.set(key, value);
      }
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/tarifler${qs ? `?${qs}` : ""}`;
  }

  // Görünür sayfa numaralarını hesapla
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label={t("pagination.aria")}>
      {currentPage > 1 && (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
        >
          {t("pagination.previous")}
        </Link>
      )}

      {start > 1 && (
        <>
          <Link
            href={buildPageUrl(1)}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-text-muted">…</span>}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildPageUrl(page)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            page === currentPage
              ? "border-primary bg-primary text-white"
              : "border-border hover:bg-bg-card"
          }`}
        >
          {page}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-text-muted">…</span>}
          <Link
            href={buildPageUrl(totalPages)}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
        >
          {t("pagination.next")}
        </Link>
      )}
    </nav>
  );
}

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

/** Active filter summary — shows which filters are active with remove buttons. */
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
    chips.push({
      label: `${CUISINE_FLAG[c as CuisineCode] ?? ""} ${CUISINE_LABEL[c as CuisineCode] ?? c}`,
      removeParam: "mutfak",
      removeValue: c,
    });
  }
  for (const a of excludeAllergens) {
    chips.push({
      label: tFilters("excludedSuffix", { label: a }),
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
