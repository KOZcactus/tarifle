import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getCategoryBySlug } from "@/lib/queries/category";
import { getRecipes } from "@/lib/queries/recipe";
import type { Metadata } from "next";

interface KategoriPageProps {
  params: Promise<{ kategori: string }>;
}

export async function generateMetadata({ params }: KategoriPageProps): Promise<Metadata> {
  const { kategori } = await params;
  const category = await getCategoryBySlug(kategori);
  if (!category) return { title: "Kategori Bulunamadı" };

  return {
    title: `${category.name} Tarifleri`,
    description: `${category.name} kategorisindeki tüm tarifler. ${category.emoji ?? ""}`,
  };
}

export default async function KategoriPage({ params }: KategoriPageProps) {
  const { kategori } = await params;
  const category = await getCategoryBySlug(kategori);

  if (!category) notFound();

  const { recipes, total } = await getRecipes({ categorySlug: kategori });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
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
