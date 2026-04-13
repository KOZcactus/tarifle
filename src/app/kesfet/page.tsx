import Link from "next/link";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getFeaturedRecipes, getQuickRecipes } from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Yeni tarifler keşfet, popüler kategorileri incele ve topluluk favorilerini gör.",
};

export default async function KesfetPage() {
  const [featured, quick, allCategories] = await Promise.all([
    getFeaturedRecipes(6),
    getQuickRecipes(8),
    getCategories(),
  ]);

  const popularCategories = allCategories.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">Keşfet</h1>
      <p className="mt-2 text-text-muted">Yeni lezzetler keşfet, ilham al.</p>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">⭐ Öne Çıkanlar</h2>
            <Link href="/tarifler" className="text-sm text-primary hover:underline">
              Tümü
            </Link>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Recipes */}
      {quick.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold">⚡ 30 Dakika Altı</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quick.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Browse */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold">📂 Kategoriler</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {popularCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/tarifler/${cat.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary hover:shadow-md"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-sm font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
