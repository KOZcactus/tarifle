import Link from "next/link";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { RecipeCardSkeleton } from "@/components/ui/Skeleton";
import { CATEGORIES } from "@/data/categories";
import { MOCK_RECIPES } from "@/data/mock-recipes";

const POPULAR_SEARCHES = ["karnıyarık", "baklava", "mojito", "mercimek", "menemen"];

export default function HomePage() {
  const featured = MOCK_RECIPES.filter((r) => r.isFeatured).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="flex flex-col items-center py-16 text-center lg:py-24">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Bugün ne pişirsek?
        </h1>
        <p className="mt-4 max-w-xl text-lg text-text-muted">
          Yemek, içecek ve kokteyl tariflerini keşfet. Topluluk varyasyonlarıyla ilham al.
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

      {/* Categories */}
      <section className="py-12">
        <h2 className="font-heading text-2xl font-bold">Kategoriler</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/tarifler/${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-center text-xs font-medium sm:text-sm">{cat.name}</span>
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
            Üye ol, favori tariflerinin varyasyonlarını ekle ve toplulukla paylaş.
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
