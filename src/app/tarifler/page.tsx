import Link from "next/link";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { getRecipes } from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import { getTags } from "@/lib/queries/tag";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifler",
  description:
    "Tüm yemek, içecek ve kokteyl tariflerini keşfet. Kategoriye, zorluğa ve süreye göre filtrele.",
};

interface TariflerPageProps {
  searchParams: Promise<{
    q?: string;
    zorluk?: string;
    kategori?: string;
    sure?: string;
    siralama?: string;
    etiket?: string | string[];
    page?: string;
  }>;
}

export default async function TariflerPage({ searchParams }: TariflerPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const difficulty = params.zorluk ?? "";
  const category = params.kategori ?? "";
  const maxMinutes = params.sure ? parseInt(params.sure, 10) : undefined;
  const sortBy = (params.siralama as "newest" | "quickest" | "popular") || undefined;
  const tagSlugs = params.etiket
    ? Array.isArray(params.etiket)
      ? params.etiket
      : [params.etiket]
    : undefined;

  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [{ recipes, total }, categories, tags] = await Promise.all([
    getRecipes({
      query: query || undefined,
      difficulty: difficulty || undefined,
      categorySlug: category || undefined,
      maxMinutes,
      tagSlugs,
      sortBy,
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
      </div>

      {/* Results */}
      {recipes.length > 0 ? (
        <>
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
