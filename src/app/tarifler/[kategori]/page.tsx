import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { CuisineFilter } from "@/components/search/CuisineFilter";
import { getCategoryBySlug } from "@/lib/queries/category";
import { getRecipes } from "@/lib/queries/recipe";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { CUISINE_CODES, type CuisineCode } from "@/lib/cuisines";
import type { Metadata } from "next";

interface KategoriPageProps {
  params: Promise<{ kategori: string }>;
  searchParams: Promise<{ mutfak?: string | string[] }>;
}

export async function generateMetadata({ params }: KategoriPageProps): Promise<Metadata> {
  const { kategori } = await params;
  const category = await getCategoryBySlug(kategori);
  if (!category) return { title: "Kategori Bulunamadı" };

  return {
    title: `${category.name} Tarifleri`,
    description: `${category.name} kategorisindeki tüm tarifler. ${category.emoji ?? ""}`,
    alternates: {
      canonical: `/tarifler/${kategori}`,
    },
  };
}

export default async function KategoriPage({ params, searchParams }: KategoriPageProps) {
  const { kategori } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(kategori);

  if (!category) notFound();

  // Parse cuisine filter
  const rawCuisines = sp.mutfak
    ? Array.isArray(sp.mutfak)
      ? sp.mutfak
      : [sp.mutfak]
    : [];
  const cuisines = rawCuisines.filter((c): c is CuisineCode =>
    (CUISINE_CODES as readonly string[]).includes(c),
  );

  const { recipes, total } = await getRecipes({
    categorySlug: kategori,
    cuisines: cuisines.length > 0 ? cuisines : undefined,
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Ana Sayfa", url: "/" },
    { name: "Tarifler", url: "/tarifler" },
    { name: category.name, url: `/tarifler/${kategori}` },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Schema.org BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{category.emoji}</span>
          <div>
            <h1 className="font-heading text-3xl font-bold">{category.name}</h1>
            <p className="mt-1 text-text-muted">{total} tarif</p>
          </div>
        </div>
      </div>

      {/* Cuisine Filter */}
      <div className="mb-6">
        <Suspense>
          <CuisineFilter selected={cuisines} />
        </Suspense>
      </div>

      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <>
          {/* Heading hierarchy: h1 (kategori adı) → h2 (sr-only) → h3
              (RecipeCard). Lighthouse heading-order fix; sadece ekran
              okuyucu görür. */}
          <h2 className="sr-only">{category.name} tarifleri</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl">{category.emoji}</span>
          <h2 className="mt-4 font-heading text-xl font-semibold">Henüz tarif eklenmemiş</h2>
          <p className="mt-2 text-sm text-text-muted">
            Bu kategoriye yakında tarifler eklenecek.
          </p>
        </div>
      )}
    </div>
  );
}
