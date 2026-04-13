import { Suspense } from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { getRecipes } from "@/lib/queries/recipe";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifler",
  description: "Tüm yemek, içecek ve kokteyl tariflerini keşfet. Kategoriye, zorluğa ve süreye göre filtrele.",
};

interface TariflerPageProps {
  searchParams: Promise<{
    q?: string;
    zorluk?: string;
    kategori?: string;
    page?: string;
  }>;
}

export default async function TariflerPage({ searchParams }: TariflerPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const difficulty = params.zorluk ?? "";
  const category = params.kategori ?? "";

  const { recipes, total } = await getRecipes({
    query: query || undefined,
    difficulty: difficulty || undefined,
    categorySlug: category || undefined,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Tarifler</h1>
        <p className="mt-2 text-text-muted">
          {total} tarif bulundu
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <FilterPanel />
        </Suspense>
      </div>

      {/* Results */}
      {recipes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <EmptyState query={query} />
      )}
    </div>
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
