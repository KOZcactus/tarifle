import Link from "next/link";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { AllergenFilter } from "@/components/search/AllergenFilter";
import { DietFilter } from "@/components/search/DietFilter";
import { getRecipes } from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import { getTags } from "@/lib/queries/tag";
import { searchRecipeIds } from "@/lib/search/recipe-search";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { ALLERGEN_ORDER } from "@/lib/allergens";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifler",
  description:
    "Tüm yemek, içecek ve kokteyl tariflerini keşfet. Kategoriye, zorluğa ve süreye göre filtrele.",
  // Filter combinations (?kategori=, ?etiket=, ?q=…) üretilen her URL
  // varyantı ayrı indekslenmesin — param-free /tarifler canonical.
  // Google'a "bu ana listeleme sayfası" sinyali.
  alternates: {
    canonical: "/tarifler",
  },
};

interface TariflerPageProps {
  searchParams: Promise<{
    q?: string;
    zorluk?: string;
    kategori?: string;
    sure?: string;
    siralama?: string;
    etiket?: string | string[];
    alerjen?: string | string[];
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

  const [{ recipes, total }, categories, tags] = await Promise.all([
    getRecipes({
      query: query || undefined,
      difficulty: difficulty || undefined,
      categorySlug: category || undefined,
      maxMinutes,
      tagSlugs,
      excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined,
      recipeIds: rankedIds,
      sortBy: activeSort,
      limit: ITEMS_PER_PAGE,
      offset,
    }),
    getCategories(),
    getTags(),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Tarifler</h1>
        <p className="mt-2 text-text-muted">{total} tarif bulundu</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <Suspense>
          <SearchBar />
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
      </div>

      {/* Sort tabs — rewrites ?siralama=... while preserving every other
          filter in the URL. Default (alphabetical) omits the param so the
          canonical URL is clean. */}
      <div className="mb-6 flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-2 text-xs uppercase tracking-wide text-text-muted">
          Sıralama:
        </span>
        {[
          // Relevance chip shows up only when there is an active query;
          // ekranı boş aramada kirletmeyelim.
          ...(query
            ? [{ key: "relevance", label: "En alakalı" } as const]
            : []),
          { key: "alphabetical", label: "Alfabetik" } as const,
          { key: "newest", label: "En yeni" } as const,
          { key: "popular", label: "En popüler" } as const,
          { key: "quickest", label: "En hızlı" } as const,
          { key: "most-variations", label: "En çok uyarlama" } as const,
          { key: "most-liked", label: "En çok beğeni" } as const,
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
          <h2 className="sr-only">Tarif listesi</h2>
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
            />
          )}
        </>
      ) : (
        <EmptyState query={query} />
      )}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
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
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Sayfalama">
      {currentPage > 1 && (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
        >
          ← Önceki
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
          Sonraki →
        </Link>
      )}
    </nav>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="text-5xl">🔍</span>
      <h2 className="mt-4 font-heading text-xl font-semibold">Tarif bulunamadı</h2>
      <p className="mt-2 text-sm text-text-muted">
        {query
          ? `"${query}" ile eşleşen tarif yok. Farklı bir arama deneyin.`
          : "Seçili filtrelere uygun tarif bulunamadı."}
      </p>
    </div>
  );
}
