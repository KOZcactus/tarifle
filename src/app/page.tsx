import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SearchBar } from "@/components/search/SearchBar";
import { FeaturedShelf } from "@/components/home/FeaturedShelf";
import { RecipeOfTheDay } from "@/components/home/RecipeOfTheDay";
import { SeasonalBanner } from "@/components/home/SeasonalBanner";
import { TimeAwareBanner } from "@/components/home/TimeAwareBanner";
import { ExpiringSoonBanner } from "@/components/home/ExpiringSoonBanner";
import { HeroVariantInit } from "@/components/home/HeroVariantInit";
import {
  HERO_VARIANT_COOKIE,
  heroTitleI18nKey,
  pickVariant,
} from "@/lib/experiments/hero-tagline";
import {
  getFeaturedRecipes,
  getRecipes,
  getPopularRecipes,
  getPersonalizedRecipes,
  getMostCookedRecentlyRecipes,
  getUserRecentlyCookedRecipes,
} from "@/lib/queries/recipe";
import { getCategories } from "@/lib/queries/category";
import { auth } from "@/lib/auth";
import type { RecipeCard as RecipeCardType } from "@/types/recipe";
import { getCuisineStats } from "@/lib/queries/cuisine-stats";
import { CUISINE_CODES } from "@/lib/cuisines";
import { getSearchSuggestions } from "@/lib/queries/search-suggestions";
import { getRandomRecipe } from "@/lib/queries/random-recipe";
import { getDietBadgesIfApplicable } from "@/lib/queries/diet-score";
import { RandomRecipeBanner } from "@/components/discovery/RandomRecipeBanner";
import { CountUp } from "@/components/ui/CountUp";
import { ProfileIncompleteBanner } from "@/components/home/ProfileIncompleteBanner";
import { DietProfilePromptBanner } from "@/components/home/DietProfilePromptBanner";
import { prisma } from "@/lib/prisma";
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

  // Profil eksik banner kontrolu (oturum 19 E paketi onboarding polish).
  // Login + bio NULL veya avatarUrl NULL ise banner gosterilir. Anonim
  // kullanicida ek DB call yok, userId NULL ise default false.
  // Diyet profili kontrolu (oturum 20). Login + dietProfile NULL ise
  // ayri bir CTA banner gosterilir; tek user query ile birlikte cek.
  const userOnboardingFlags = userId
    ? await prisma.user
        .findUnique({
          where: { id: userId },
          select: { bio: true, avatarUrl: true, dietProfile: true },
        })
        .then((u) => ({
          profileIncomplete: !u?.bio || !u?.avatarUrl,
          dietProfileMissing: !u?.dietProfile,
        }))
    : { profileIncomplete: false, dietProfileMissing: false };
  const profileIncomplete = userOnboardingFlags.profileIncomplete;
  const dietProfileMissing = userOnboardingFlags.dietProfileMissing;

  // Hero A/B variant pick (oturum 13 minimal kurulum). Cookie varsa onu
  // kullanir, yoksa rastgele 50/50; HeroVariantInit client component
  // mount sonrasi cookie'yi 30 gun persist eder + Sentry tag setler.
  const cookieStore = await cookies();
  const heroVariant = pickVariant(cookieStore.get(HERO_VARIANT_COOKIE)?.value);
  const heroTitleKey = heroTitleI18nKey(heroVariant);

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
    mostCookedRecently,
    personalCooked,
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
    getMostCookedRecentlyRecipes({ days: 7, limit: 6 }),
    userId
      ? getUserRecentlyCookedRecipes(userId, 6)
      : Promise.resolve<RecipeCardType[]>([]),
    getTranslations("home"),
    getTranslations("nav"),
  ]);
  const tProfileBanner = await getTranslations("home.profileBanner");

  // H: Home 🎒 CTA. Login user'in pantry doluluk kontrolu; boşsa kart
  // gizlenir. Sadece count fetch, payload küçük kalsın.
  const pantryCount = userId
    ? await (
        await import("@/lib/prisma")
      ).prisma.userPantryItem
        .count({ where: { userId } })
        .catch(() => 0)
    : 0;

  // Tarif sayısı olan kategorileri önce göster
  const sortedCategories = [...categories].sort(
    (a, b) => b._count.recipes - a._count.recipes,
  );

  // Diyet badge'leri (oturum 20). Tum 3 shelf'in (featured + popular +
  // personalized) recipe ID'leri tek batched fetch.
  const homeRecipeIds = [
    ...featured.map((r) => r.id),
    ...popular.map((r) => r.id),
    ...personalized.recipes.map((r) => r.id),
  ];
  const homeDietBadges = await getDietBadgesIfApplicable(userId, homeRecipeIds);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* A/B variant cookie persist + Sentry tag tracker (render etmez). */}
      <HeroVariantInit variant={heroVariant} />

      {/* Profil eksik banner (login + bio/avatar NULL), dismissable */}
      <div className="pt-4">
        <ProfileIncompleteBanner
          incomplete={profileIncomplete}
          labels={{
            title: tProfileBanner("title"),
            body: tProfileBanner("body"),
            cta: tProfileBanner("cta"),
            dismiss: tProfileBanner("dismiss"),
          }}
        />
        <DietProfilePromptBanner show={dietProfileMissing} />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center py-16 text-center lg:py-24">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          🍳 {t("heroBadgePrefix")} <CountUp target={recipeCount} /> {t("heroBadgeSuffix")}
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {t.rich(heroTitleKey, {
            accent: (chunks) => <span className="text-primary">{chunks}</span>,
          })}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-text-muted">
          {t("heroTagline")}
        </p>

        {/* Search */}
        <div className="mt-8 w-full max-w-xl">
          <Suspense>
            <SearchBar
              placeholder={t("searchPlaceholder")}
              suggestions={searchSuggestions}
              submitOnType={false}
            />
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

      {/* İkinci hero: karar-motoru vaadi ile AI Asistan'a yönlendirme.
          Eski versiyonda burada inline malzeme prompt'u vardı; Kerem
          oturum 12 kararı, prompt /ai-asistan ile tekrar ediyordu. İllüs
          trasyon + tek CTA ile temizlendi; kullanıcı CTA'ya basınca
          sayfada tam deneyimi (autocomplete + 7 filtre + sonuç listesi)
          görür. Border-top primary hero'dan ayırır. */}
      <section className="flex flex-col items-center border-t border-border py-12 text-center lg:py-16">
        <span aria-hidden="true" className="mb-3 text-6xl sm:text-7xl">
          🤖
        </span>
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          {t.rich("heroSecondaryTitle", {
            accent: (chunks) => <span className="text-primary">{chunks}</span>,
          })}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-text-muted sm:text-base">
          {t("heroSecondaryTagline")}
        </p>
        <Link
          href="/ai-asistan"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:text-base"
        >
          {t("heroSecondaryCta")}
          <span aria-hidden="true">→</span>
        </Link>

        {/* H: Login + pantry dolu kullanıcıya 🎒 CTA. 2 tıklamayı
            (AI Asistan'a git → Dolabımı getir) tek tıkla
            birleştirir. Misafir veya dolap boşsa gizli. */}
        {userId && pantryCount > 0 && (
          <Link
            href="/ai-asistan?autoPantry=1"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300/60 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-900 transition-colors hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:border-emerald-500"
          >
            <span aria-hidden="true">🎒</span>
            {t("heroPantryCta", { count: pantryCount })}
          </Link>
        )}
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
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                dietBadge={homeDietBadges.get(recipe.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Son pisirdiklerin (oturum 24 yeni). Login user'in kendi cooked
          gecmisi, kronolojik desc. Yeniden pisirme prompt + kisisel arsiv
          carki. Pisirilen yoksa shelf gizli (yeni siteye dair geri bildirim:
          ilk pisirmeden once gorunmuyor). Personalized'in altinda cunku
          tercihlere gore kuratoryel oneri once, sonra "kendi gecmisin". */}
      {userId && session?.user?.username && personalCooked.length > 0 && (
        <section className="py-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-text">
                {t("sectionPersonalCooked")}
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                {t("sectionPersonalCookedSubtitle")}
              </p>
            </div>
            <Link
              href={`/profil/${session.user.username}#pisirdiklerim`}
              className="shrink-0 text-sm text-primary hover:underline"
            >
              {t("personalCookedSeeAll")}
            </Link>
          </div>
          <FeaturedShelf
            recipes={personalCooked}
            ariaLabel={t("sectionPersonalCooked")}
          />
        </section>
      )}

      {/* Editör Seçimi, Tarifle editörlerinin haftalık kürasyon shelf'i.
          Rotasyonel (getFeaturedPool + hafta indeksi). Başlık + subtitle
          ikilisi Tarifle ton'unu pekiştirir; altın rozet RecipeCard
          seviyesinde görünür.
          Mobile'da horizontal scroll carousel (snap + arrow), desktop'ta
          3-kolon grid, FeaturedShelf component. */}
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
          <FeaturedShelf recipes={featured} dietBadges={homeDietBadges} />
        </section>
      )}

      {/* Bu hafta en cok pisirilenler shelf (oturum 23 yeni). Sosyal kanit:
          son 7 gunde distinct user count desc. Yeni sitede cooked verisi
          azsa bos liste doner, shelf gizlenir. */}
      {mostCookedRecently.length > 0 && (
        <section className="py-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-text">
                <span aria-hidden>👨‍🍳</span> Bu hafta en çok pişirilenler
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Tarifle topluluğunun bu hafta en çok pişirdiği tarifler.
              </p>
            </div>
            <Link
              href="/tarifler?siralama=popular"
              className="shrink-0 text-sm text-primary hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <FeaturedShelf
            recipes={mostCookedRecently}
            ariaLabel="Bu hafta en çok pişirilenler"
          />
        </section>
      )}

      {/* Sezon / bayram seçkisi (#2): mevsime veya yaklaşan bayrama göre
          4-6 tarif bannerı. Boşsa hiç render etmez. */}
      <section className="py-6">
        <Suspense fallback={null}>
          <SeasonalBanner />
        </Suspense>
      </section>

      {/* C: Login + SKT takibi opt-in user'da dolaptaki yaklaşan son
          kullanma tarihli malzemeleri içeren tarifler. Zero-waste UX. */}
      <section className="py-4">
        <Suspense fallback={null}>
          <ExpiringSoonBanner session={session} />
        </Suspense>
      </section>

      {/* D: Şu saatte ne yesek? TR timezone bazlı gün içi öneri.
          Saat dışı (none) veya result 0 ise render etmez. */}
      <section className="py-4">
        <Suspense fallback={null}>
          <TimeAwareBanner />
        </Suspense>
      </section>

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
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                dietBadge={homeDietBadges.get(recipe.id)}
              />
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

      {/* Menü Planlayıcı banner (oturum 25 GPT P2 audit). AI Asistan
          banner'ın hemen altına; "premium/retention özelliği daha
          görünür olmalı" GPT önerisi. Login user'a /menu-planlayici,
          anonymous'a /kayit yönlendirir (kayit sayfası benefits'inde
          "Bu haftanın menüsünü AI ile planla" zaten görünür). */}
      <section className="pt-3">
        <Link
          href={userId ? "/menu-planlayici" : "/kayit"}
          className="group flex flex-col items-start gap-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 transition-all hover:border-emerald-500/40 hover:shadow-md sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-3xl">
            📅
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {t("menuPlannerBannerEyebrow")}
            </p>
            <h3 className="mt-0.5 font-heading text-xl font-bold text-text sm:text-2xl">
              {t("menuPlannerBannerTitle")}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {t("menuPlannerBannerDescription")}
            </p>
          </div>
          <span className="ml-auto rounded-lg border border-emerald-500/30 bg-bg-card px-4 py-2 text-sm font-medium text-emerald-700 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:text-emerald-400">
            {t("menuPlannerBannerCta")}
          </span>
        </Link>
      </section>

      {/* Random recipe shuffle (oturum 21 yer degisiklik): kullanici geri
          bildirim sonrasi anasayfa ust kismindan AI Asistan altina tasindi,
          kesfet kumesinin kalbinde duruyor. */}
      {randomRecipe && (
        <section className="py-4">
          <RandomRecipeBanner initial={randomRecipe} />
        </section>
      )}

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
            {/* count = toplam mutfak sayisi (Hakkimizda ile tutarli, oturum
                25 GPT audit fix). cuisineStats >=3 filtreli oldugu icin
                sadece liste sirasinda kullanilir; subtitle gercek total. */}
            {t("cuisineSubtitle", { count: CUISINE_CODES.length, total: recipeCount })}
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
