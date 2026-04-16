import Link from "next/link";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getFeaturedRecipes, getQuickRecipes } from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import { getCuisineStats } from "@/lib/queries/cuisine-stats";
import { getRandomRecipe } from "@/lib/queries/random-recipe";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Yeni tarifler keşfet, popüler kategorileri incele ve topluluk favorilerini gör.",
};

// Rendered per-request so we always show the latest featured + popular state,
// and — importantly — so CI builds don't need a real DATABASE_URL to prerender
// this page. Other DB-backed pages (/, /tarifler) are already dynamic because
// they touch auth cookies; Keşfet has no auth, which is why Next defaulted it
// to static. Explicit `force-dynamic` makes the intent visible.
export const dynamic = "force-dynamic";

export default async function KesfetPage() {
  const [featured, quick, allCategories, cuisineStats, randomRecipe] = await Promise.all([
    getFeaturedRecipes(6),
    getQuickRecipes(8),
    getCategories(),
    getCuisineStats(),
    getRandomRecipe(),
  ]);

  // Tarif sayısına göre sırala, en çok tarifi olan ilk 8
  const popularCategories = [...allCategories]
    .sort((a, b) => b._count.recipes - a._count.recipes)
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">Keşfet</h1>
      <p className="mt-2 text-text-muted">Yeni lezzetler keşfet, ilham al.</p>

      {/* Random Recipe — "Bugün ne yapsam?" */}
      {randomRecipe && (
        <section className="mt-8">
          <Link
            href={`/tarif/${randomRecipe.slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 transition-all hover:border-primary hover:shadow-md"
          >
            <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
              🎲
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Rastgele tarif
              </p>
              <p className="mt-0.5 font-heading text-lg font-bold text-text group-hover:text-primary">
                {randomRecipe.emoji} {randomRecipe.title}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Ne yapacağına karar veremiyorsan bu tarifi dene →
              </p>
            </div>
          </Link>
        </section>
      )}

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
              className="group flex items-center gap-3 rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary hover:shadow-md"
            >
              <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                {cat.emoji}
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-medium">{cat.name}</span>
                {cat._count.recipes > 0 && (
                  <span className="text-[10px] text-text-muted">
                    {cat._count.recipes} tarif
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Cuisine Discovery */}
      {cuisineStats.length >= 4 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold">🌍 Mutfaklar</h2>
          <p className="mt-1 text-sm text-text-muted">
            {cuisineStats.length} farklı mutfaktan tarifler keşfet
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cuisineStats.slice(0, 10).map((cs) => (
              <Link
                key={cs.code}
                href={`/tarifler?mutfak=${cs.code}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                  {cs.flag}
                </span>
                <div>
                  <span className="text-sm font-medium text-text">{cs.label}</span>
                  <span className="block text-[10px] text-text-muted">{cs.count} tarif</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI Asistan CTA */}
      <section className="mt-12">
        <Link
          href="/ai-asistan"
          className="group flex items-center gap-4 rounded-2xl border border-accent-blue/20 bg-gradient-to-r from-accent-blue/10 to-transparent p-5 transition-all hover:border-accent-blue/40 hover:shadow-md"
        >
          <span className="text-3xl">🧠</span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
              AI Asistan
            </p>
            <p className="mt-0.5 font-heading text-lg font-bold text-text">
              Elindeki malzemelerle ne yapabilirsin?
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Malzemelerini yaz, sana en uygun tarifleri bulalım →
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
