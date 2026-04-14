import Link from "next/link";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { getFeaturedRecipes, getRecipes } from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";

const POPULAR_SEARCHES = [
  "karnıyarık",
  "baklava",
  "mojito",
  "mercimek",
  "menemen",
  "tavuk",
  "çorba",
];

export default async function HomePage() {
  const [featured, categories, { total: recipeCount }] = await Promise.all([
    getFeaturedRecipes(6),
    getCategories(),
    getRecipes({ limit: 0 }),
  ]);

  // Tarif sayısı olan kategorileri önce göster
  const sortedCategories = [...categories].sort(
    (a, b) => b._count.recipes - a._count.recipes,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="flex flex-col items-center py-16 text-center lg:py-24">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          🍳 {recipeCount} tarif keşfetmeye hazır
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Bugün ne{" "}
          <span className="text-primary">pişirsek</span>?
        </h1>
        <p className="mt-4 max-w-xl text-lg text-text-muted">
          Yemek, içecek ve kokteyl tariflerini keşfet. Topluluk uyarlamalarıyla ilham al.
        </p>

        {/* Search */}
        <div className="mt-8 w-full max-w-xl">
          <Suspense>
            <SearchBar placeholder="Tarif veya malzeme ara..." />
          </Suspense>
        </div>

        {/* Popular Searches */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <Link
              key={term}
              href={`/tarifler?q=${term}`}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              #{term}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Recipes */}
      {featured.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold">Öne Çıkan Tarifler</h2>
            <Link href="/tarifler" className="text-sm text-primary hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-12">
        <h2 className="font-heading text-2xl font-bold">Kategoriler</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sortedCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/tarifler/${cat.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
                {cat.emoji}
              </span>
              <span className="text-center text-xs font-medium sm:text-sm">
                {cat.name}
              </span>
              {cat._count.recipes > 0 && (
                <span className="text-[10px] text-text-muted">
                  {cat._count.recipes} tarif
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="rounded-2xl border border-border bg-bg-card p-8 text-center sm:p-12">
          <span className="text-4xl">👨‍🍳</span>
          <h2 className="mt-4 font-heading text-2xl font-bold">
            Kendi tarifini paylaş
          </h2>
          <p className="mt-2 text-text-muted">
            Üye ol, favori tariflerinin uyarlamalarını ekle ve toplulukla paylaş.
          </p>
          <Link
            href="/kayit"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Ücretsiz Üye Ol
          </Link>
        </div>
      </section>
    </div>
  );
}
