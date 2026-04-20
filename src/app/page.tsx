import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { RecipeOfTheDay } from "@/components/home/RecipeOfTheDay";
import {
  getFeaturedRecipes,
  getRecipes,
  getPopularRecipes,
  getPersonalizedRecipes,
} from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import { auth } from "@/lib/auth";
import { getCuisineStats } from "@/lib/queries/cuisine-stats";
import { getSearchSuggestions } from "@/lib/queries/search-suggestions";
import { getRandomRecipe } from "@/lib/queries/random-recipe";
import { RandomRecipeBanner } from "@/components/discovery/RandomRecipeBanner";
import { CountUp } from "@/components/ui/CountUp";
import {
  getSuggestedCooks,
  getFollowingUserIds,
} from "@/lib/queries/follow";
import { SuggestedCooksSection } from "@/components/home/SuggestedCooksSection";

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
  // Session önce çekiliyor ki aşağıdaki Promise.all'da personalized shelf
  // çağrısı userId'ye bağlı olarak conditional yapılabilsin. auth() hızlı
  // (~50ms); waterfall alt-sınırı minimum.
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [
    featured,
    popular,
    categories,
    { total: recipeCount },
    cuisineStats,
    searchSuggestions,
    randomRecipe,
    personalized,
    suggestedCooks,
    viewerFollowingIds,
    t,
    tNav,
  ] = await Promise.all([
    getFeaturedRecipes(6),
    getPopularRecipes(8),
    getCategories(),
    getRecipes({ limit: 0 }),
    getCuisineStats(),
    getSearchSuggestions(),
    getRandomRecipe(),
    userId
      ? getPersonalizedRecipes({ userId, limit: 8 })
      : Promise.resolve({ recipes: [], hasPrefs: false }),
    getSuggestedCooks(userId, 6),
    userId ? getFollowingUserIds(userId) : Promise.resolve<string[]>([]),
    getTranslations("home"),
    getTranslations("nav"),
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
          🍳 <CountUp target={recipeCount} /> {t("heroBadgeSuffix")}
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {t.rich("heroTitle", {
            accent: (chunks) => <span className="text-primary">{chunks}</span>,
          })}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-text-muted">
          {t("heroTagline")}
        </p>

        {/* Search */}
        <div className="mt-8 w-full max-w-xl">
          <Suspense>
            <SearchBar placeholder={t("searchPlaceholder")} suggestions={searchSuggestions} />
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

      {/* Sana özel, giriş yapmış + tercihleri dolu user için kişiselleştirilmiş
          ilk shelf. Featured'den önce çünkü kullanıcı kendi profilinden
          seçtiği içeriği anında görmeli. Tercih boşsa bu section hiç
          render edilmez (fallback: featured). */}
      {personalized.hasPrefs && personalized.recipes.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                {t("sectionPersonalized")}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {t("sectionPersonalizedSubtitle")}
              </p>
            </div>
            <Link href="/ayarlar" className="text-sm text-primary hover:underline">
              {t("personalizedEdit")}
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {personalized.recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Editör Seçimi, Tarifle editörlerinin haftalık kürasyon shelf'i.
          Rotasyonel (getFeaturedPool + hafta indeksi). Başlık + subtitle
          ikilisi Tarifle ton'unu pekiştirir; altın rozet RecipeCard
          seviyesinde görünür. */}
      {featured.length > 0 && (
        <section className="py-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                {t("sectionFeatured")}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {t("sectionFeaturedSubtitle")}
              </p>
            </div>
            <Link href="/tarifler" className="shrink-0 text-sm text-primary hover:underline">
              {t("seeAll")}
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Random recipe shuffle */}
      {randomRecipe && (
        <section className="py-4">
          <RandomRecipeBanner initial={randomRecipe} />
        </section>
      )}

      {/* Popular recipes, en çok görüntülenen */}
      {popular.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold">{t("sectionPopular")}</h2>
            <Link
              href="/tarifler?siralama=popular"
              className="text-sm text-primary hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Recipe of the day, Ome Cikan grid'inin kuratoryel devami gibi */}
      <RecipeOfTheDay />

      {/* AI Assistant Banner, ozellesmis oneri istiyorsan tarzi bir CTA, Gunun Tarifi'nin altinda */}
      <section className="pt-4">
        <Link
          href="/ai-asistan"
          className="group flex flex-col items-start gap-4 rounded-2xl border border-accent-blue/20 bg-gradient-to-br from-accent-blue/10 via-accent-blue/5 to-transparent p-6 transition-all hover:border-accent-blue/40 hover:shadow-md sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-3xl">
            🧠
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
              {tNav("aiAssistant")}
            </p>
            <h3 className="mt-0.5 font-heading text-xl font-bold text-text sm:text-2xl">
              {t("aiBannerTitle")}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {t("aiBannerDescription")}
            </p>
          </div>
          <span className="ml-auto rounded-lg border border-accent-blue/30 bg-bg-card px-4 py-2 text-sm font-medium text-accent-blue transition-colors group-hover:bg-accent-blue group-hover:text-white">
            {t("aiBannerCta")}
          </span>
        </Link>
      </section>

      {/* Önerilen Aşçılar, topluluk loop açısı. Boşsa section kendini
          gizler (SuggestedCooksSection içinde). Anonymous kullanıcı için
          de gözükür; follow butonu click'te /giris'e yönlendirir. */}
      <SuggestedCooksSection
        cooks={suggestedCooks}
        viewerSignedIn={!!userId}
        viewerId={userId}
        viewerFollowingIds={new Set(viewerFollowingIds)}
      />

      {/* Cuisine Discovery */}
      {cuisineStats.length >= 4 && (
        <section className="py-12">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold">{t("sectionCuisines")}</h2>
            <Link
              href="/tarifler"
              className="text-sm text-primary hover:underline"
            >
              {t("seeAllFilter")}
            </Link>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {t("cuisineSubtitle", { count: cuisineStats.length, total: recipeCount })}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                  <span className="text-sm font-medium text-text">
                    {cs.label}
                  </span>
                  <span className="block text-[10px] text-text-muted">
                    {t("recipeCountSmall", { count: cs.count })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-12">
        <h2 className="font-heading text-2xl font-bold">{t("sectionCategories")}</h2>
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
                  {t("recipeCountSmall", { count: cat._count.recipes })}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA, sadece giriş yapmamış kullanıcılara */}
      {!session?.user && (
        <section className="py-12">
          <div className="rounded-2xl border border-border bg-bg-card p-8 text-center sm:p-12">
            <span className="text-4xl">👨‍🍳</span>
            <h2 className="mt-4 font-heading text-2xl font-bold">
              {t("ctaTitle")}
            </h2>
            <p className="mt-2 text-text-muted">
              {t("ctaDescription")}
            </p>
            <Link
              href="/kayit"
              className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
