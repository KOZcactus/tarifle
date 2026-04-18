import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { getFeaturedRecipes, getQuickRecipes, getPopularRecipes } from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import { getCuisineStats } from "@/lib/queries/cuisine-stats";
import { getSearchSuggestions } from "@/lib/queries/search-suggestions";
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
  const [featured, quick, popular, allCategories, cuisineStats, searchSuggestions, t] =
    await Promise.all([
      getFeaturedRecipes(6),
      getQuickRecipes(8),
      getPopularRecipes(8),
      getCategories(),
      getCuisineStats(),
      getSearchSuggestions(),
      getTranslations("discover"),
    ]);

  // Tarif sayısına göre sırala, en çok tarifi olan ilk 8
  const popularCategories = [...allCategories]
    .sort((a, b) => b._count.recipes - a._count.recipes)
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
      <p className="mt-2 text-text-muted">{t("subtitle")}</p>

      {/* Search + popular queries */}
      <div className="mt-6">
        <Suspense>
          <SearchBar placeholder={t("searchPlaceholder")} suggestions={searchSuggestions} />
        </Suspense>
        <div className="mt-3 flex flex-wrap gap-2">
          {["tavuk", "çorba", "makarna", "tatlı", "salata", "kokteyl", "vegan"].map((term) => (
            <Link
              key={term}
              href={`/tarifler?q=${term}`}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              #{term}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">{t("sectionFeatured")}</h2>
            <Link href="/tarifler" className="text-sm text-primary hover:underline">
              {t("seeAll")}
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
          <h2 className="font-heading text-xl font-bold">{t("sectionQuick")}</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quick.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold">{t("sectionPopular")}</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popular.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Browse */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold">{t("sectionCategories")}</h2>
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
                    {t("recipeCountSmall", { count: cat._count.recipes })}
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
          <h2 className="font-heading text-xl font-bold">{t("sectionCuisines")}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {t("cuisineSubtitle", { count: cuisineStats.length })}
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
                  <span className="block text-[10px] text-text-muted">
                    {t("recipeCountSmall", { count: cs.count })}
                  </span>
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
              {t("aiCtaLabel")}
            </p>
            <p className="mt-0.5 font-heading text-lg font-bold text-text">{t("aiCtaTitle")}</p>
            <p className="mt-0.5 text-xs text-text-muted">{t("aiCtaSubtitle")}</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
