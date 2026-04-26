import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { IngredientList } from "@/components/recipe/IngredientList";
import { MeasureConverter } from "@/components/recipe/MeasureConverter";
import { getAllIngredientGuides } from "@/lib/recipe/ingredient-guide";
import { AllergenBadges } from "@/components/recipe/AllergenBadges";
import { AllergenConfidenceNote } from "@/components/recipe/AllergenConfidenceNote";
import { computeAllergenConfidence } from "@/lib/recipe/allergen-confidence";
import { RecipeSteps } from "@/components/recipe/RecipeSteps";
import { NutritionInfo } from "@/components/recipe/NutritionInfo";
import { HungerBar } from "@/components/recipe/HungerBar";
import { SaveMenu } from "@/components/recipe/SaveMenu";
import { ShareMenu } from "@/components/recipe/ShareMenu";
import { VariationForm } from "@/components/recipe/VariationForm";
import { CookingMode } from "@/components/recipe/CookingMode";
import { PrintButton } from "@/components/recipe/PrintButton";
import { PdfDownloadButton } from "@/components/recipe/PdfDownloadButton";
import { AgeGate } from "@/components/recipe/AgeGate";
import { VariationCard } from "@/components/recipe/VariationCard";
import { ReviewsSection } from "@/components/recipe/ReviewsSection";
import { SimilarRecipes } from "@/components/recipe/SimilarRecipes";
import { UserPhotoGrid } from "@/components/recipe/UserPhotoGrid";
import { UserPhotoUpload } from "@/components/recipe/UserPhotoUpload";
import { isUserPhotosEnabled } from "@/lib/site-settings";
import { generateRecipeJsonLd, generateBreadcrumbJsonLd, generateRecipeFaqJsonLd } from "@/lib/seo";
import { CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";
import { SITE_URL } from "@/lib/constants";
import {
  getRecipeBySlug,
  getRecipeReviews,
  incrementViewCount,
} from "@/lib/queries/recipe";
import {
  logDailyView,
  getRecipeViewsLastDays,
} from "@/lib/queries/recipe-view-daily";
import { getSimilarRecipes } from "@/lib/queries/similar-recipes";
import { getRecipeVariants } from "@/lib/queries/recipe-variants";
import { RecipeVariantsPanel } from "@/components/recipe/RecipeVariantsPanel";
import { isBookmarked, getLikedVariationIds } from "@/lib/queries/user";
import { getCollectionsForRecipe } from "@/lib/queries/collection";
import { auth } from "@/lib/auth";
import { getPantryMatchForRecipe } from "@/lib/pantry/server";
import { PantryMatchBadge } from "@/components/pantry/PantryMatchBadge";
import { CookedButton } from "@/components/pantry/CookedButton";
import { RecipeCookedToggle } from "@/components/recipe/RecipeCookedToggle";
import { RecipeTimeline } from "@/components/recipe/RecipeTimeline";
import {
  isCookedByUser,
  getCookedCount,
} from "@/lib/queries/recipe-cooked";
import { getRecipeDietScore } from "@/lib/queries/diet-score";
import { DietFitCard } from "@/components/recipe/DietFitCard";
import { isValidLocale, type Locale } from "@/i18n/config";
import {
  hasFullTranslation,
  mapTranslatedIngredients,
  mapTranslatedSteps,
  pickRecipeDescription,
  pickRecipeServingSuggestion,
  pickRecipeTipNote,
  pickRecipeTitle,
} from "@/lib/recipe/translate";
import type { Metadata } from "next";

type VariationSort = "yeni" | "begeni" | "kolay";
const VARIATION_SORTS: VariationSort[] = ["yeni", "begeni", "kolay"];
const VARIATION_SORT_KEY: Record<VariationSort, string> = {
  yeni: "variationSortNewest",
  begeni: "variationSortMostLiked",
  kolay: "variationSortEasiest",
};

// Sosyal kanit esigi: viewCount bu sayinin altindayken goruntulenme
// sayisi UI'da gizlenir. 30 = ~bir haftalik organik trafikte yeni
// tarifin ulasabildigi minimum; alti yalniz baslangic gurultusu.
// "3 goruntulendi" gostermek yerine hic gostermemek ziyaretciyi
// cesaretsizlestirmez. viewsThisWeek zaten > 0 filtresi kullaniyor.
const VIEW_COUNT_MIN_DISPLAY = 30;

interface TarifPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ siralama?: string }>;
}

function formatMinutesLocalized(
  minutes: number,
  t: (key: "minutesShort" | "hoursShort" | "hoursMinutes", values?: Record<string, string | number>) => string,
): string {
  if (minutes < 60) return t("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return t("hoursShort", { n: hours });
  return t("hoursMinutes", { h: hours, m: remaining });
}

export async function generateMetadata({ params }: TarifPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [recipe, localeRaw] = await Promise.all([
    getRecipeBySlug(slug),
    getLocale(),
  ]);
  const locale: Locale = isValidLocale(localeRaw) ? localeRaw : "tr";
  const [tMeta, tCard, tCuisine, tDifficulty] = await Promise.all([
    getTranslations({ locale, namespace: "metadata.recipeDetail" }),
    getTranslations({ locale, namespace: "recipes.card" }),
    getTranslations({ locale, namespace: "cuisines" }),
    getTranslations({ locale, namespace: "aiCommentary.difficultyLabels" }),
  ]);
  void tDifficulty; // unused, we pick the capitalized form from recipes.card

  if (!recipe) return { title: tMeta("notFoundTitle") };

  // Canonical yönetimi: tarifle.app non-www kanonik, www→non-www 308
  // redirect Cloudflare'de. Bu alternates.canonical `metadataBase`
  // (SITE_URL) ile çözülür; `?siralama=` gibi view state'leri
  // indekslenmesin diye her tarifin kanonu param-free slug URL'i.
  //
  // OpenGraph image'ı src/app/tarif/[slug]/opengraph-image.tsx
  // convention'ı otomatik ekliyor, burada manual image referansı
  // vermeye gerek yok, duplicate olur.
  const title = pickRecipeTitle(recipe.title, recipe.translations, locale);
  const description = pickRecipeDescription(
    recipe.description,
    recipe.translations,
    locale,
  );

  const cuisineCode = recipe.cuisine as CuisineCode | null | undefined;
  const cuisineLabel =
    cuisineCode && tCuisine.has(cuisineCode) ? tCuisine(cuisineCode) : null;

  const difficultyKey =
    recipe.difficulty === "EASY"
      ? "difficultyEasy"
      : recipe.difficulty === "MEDIUM"
        ? "difficultyMedium"
        : "difficultyHard";
  const difficultyLabel = tCard(difficultyKey);
  const timeLabel = formatMinutesLocalized(
    recipe.totalMinutes,
    (key, values) => tCard(key, values ?? {}),
  );
  const calories = recipe.averageCalories
    ? tMeta("caloriesSuffix", { kcal: recipe.averageCalories })
    : "";

  const metaDescription = cuisineLabel
    ? tMeta("descriptionWithCuisine", {
        title,
        cuisine: cuisineLabel,
        difficulty: difficultyLabel,
        time: timeLabel,
        servings: recipe.servingCount,
        calories,
      })
    : tMeta("descriptionNoCuisine", {
        title,
        difficulty: difficultyLabel,
        time: timeLabel,
        servings: recipe.servingCount,
        calories,
      });

  // OG image has two locale variants generated by generateImageMetadata in
  // opengraph-image.tsx. Crawlers don't send cookies, so we bake the viewer's
  // locale into the image URL here, the cached image matches the locale
  // that rendered this page at crawl time.
  const ogImageUrl = `/tarif/${recipe.slug}/opengraph-image/${locale === "en" ? "en" : "tr"}`;

  // Alcohol-gated recipes (cocktail type or "alkollu" tag) carry an age
  // gate overlay (AgeGate v2), ancak SSR HTML'de tarif content + Recipe
  // schema her zaman render edilir; Google bot schema'yi gorur + indexler.
  // Onceki surum noindex ile alkollu tarifleri SEO disi birakiyordu;
  // rakipler (Yemek.com, Nefis Yemek Tarifleri) alkollu tarifleri index
  // ediyor ve editoryal tarif icerigi TAPDK reklam/promosyon tanimina
  // girmez. 96 alkollu tarifin SEO trafigi acik, kullanici sayfaya
  // geldigi anda gate overlay yasi dogrulatir.
  return {
    title,
    description: metaDescription,
    alternates: {
      canonical: `/tarif/${recipe.slug}`,
      // Cookie-based i18n, aynı URL iki dilde render ediyor. Google'a
      // x-default + tr + en sinyali ver; bilingual arama EN trafiği için
      // faydalı.
      languages: {
        "tr-TR": `/tarif/${recipe.slug}`,
        "en-US": `/tarif/${recipe.slug}`,
        "x-default": `/tarif/${recipe.slug}`,
      },
    },
    openGraph: {
      title,
      description: description.slice(0, 200),
      url: `/tarif/${recipe.slug}`,
      type: "article",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 200),
      images: [ogImageUrl],
    },
  };
}

export default async function TarifPage({ params, searchParams }: TarifPageProps) {
  const { slug } = await params;
  const { siralama } = await searchParams;
  const [recipe, localeRaw, t, tRecipe, tCard, tCuisine] = await Promise.all([
    getRecipeBySlug(slug),
    getLocale(),
    getTranslations("recipe"),
    getTranslations("recipes"),
    getTranslations("recipes.card"),
    getTranslations("cuisines"),
  ]);

  if (!recipe) notFound();

  const locale: Locale = isValidLocale(localeRaw) ? localeRaw : "tr";
  const translations = recipe.translations as
    | Record<string, Parameters<typeof pickRecipeTitle>[1] extends infer _ ? never : never>
    | null
    | undefined;
  const translatedTitle = pickRecipeTitle(recipe.title, recipe.translations, locale);
  const translatedDescription = pickRecipeDescription(
    recipe.description,
    recipe.translations,
    locale,
  );
  const translatedIngredients = mapTranslatedIngredients(
    recipe.ingredients,
    recipe.translations,
    locale,
  );
  const ingredientGuides = await getAllIngredientGuides();
  const translatedSteps = mapTranslatedSteps(
    recipe.steps,
    recipe.translations,
    locale,
  );
  const translatedTipNote = pickRecipeTipNote(
    recipe.tipNote,
    recipe.translations,
    locale,
  );
  const translatedServingSuggestion = pickRecipeServingSuggestion(
    recipe.servingSuggestion,
    recipe.translations,
    locale,
  );
  // `translations` narrowing, Prisma Json type. Reference left for clarity.
  void translations;

  const session = await auth();
  const variationIds = recipe.variations?.map((v) => v.id) ?? [];
  const [
    bookmarked,
    userCollections,
    similarRecipes,
    likedVariationIds,
    userPhotosEnabled,
    variants,
    pantryMatch,
    userVoicePref,
    cookedCount,
    isCookedByMe,
  ] = await Promise.all([
    session?.user?.id
      ? isBookmarked(session.user.id, recipe.id)
      : Promise.resolve(false),
    session?.user?.id
      ? getCollectionsForRecipe(session.user.id, recipe.id)
      : Promise.resolve([]),
    getSimilarRecipes(recipe.id, 6),
    session?.user?.id
      ? getLikedVariationIds(session.user.id, variationIds)
      : Promise.resolve(new Set<string>()),
    isUserPhotosEnabled(),
    getRecipeVariants(recipe.slug),
    session?.user?.id
      ? getPantryMatchForRecipe(
          session.user.id,
          recipe.ingredients.map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit,
            isOptional: i.isOptional,
          })),
        ).catch(() => null)
      : Promise.resolve(null),
    // TTS voice preference for Cooking Mode. Default female (misafir
    // veya pref yoksa). Also bundle dietProfile + showDietBadge for the
    // Diyet Uyumu kart (DIET_SCORE_PLAN, oturum 20).
    session?.user?.id
      ? (async () => {
          const row = await import("@/lib/prisma").then((m) =>
            m.prisma.user.findUnique({
              where: { id: session.user!.id },
              select: {
                ttsVoicePreference: true,
                dietProfile: true,
                showDietBadge: true,
              },
            }),
          );
          return {
            ttsVoice: (row?.ttsVoicePreference === "male" ? "male" : "female") as
              | "female"
              | "male",
            dietProfile: row?.dietProfile ?? null,
            showDietBadge: row?.showDietBadge ?? true,
          };
        })()
      : Promise.resolve({
          ttsVoice: "female" as const,
          dietProfile: null as string | null,
          showDietBadge: true,
        }),
    getCookedCount(recipe.id),
    session?.user?.id
      ? isCookedByUser(session.user.id, recipe.id)
      : Promise.resolve(false),
  ]);

  // Diyet skoru (oturum 20). Login + dietProfile set + showDietBadge true
  // ise pre-computed RecipeDietScore'tan oku, render et.
  const dietScore =
    userVoicePref.dietProfile && userVoicePref.showDietBadge
      ? await getRecipeDietScore(recipe.id, userVoicePref.dietProfile)
      : null;

  // Surface admin/moderator UI inline on community variations so a moderator
  // can hide a clearly-bad post without leaving the recipe page. `session.user.role`
  // is populated by the jwt + session callbacks in lib/auth.ts and typed by
  // src/types/next-auth.d.ts.
  const isModerator =
    session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  // Variation sıralama, URL'den okur, default "yeni". Server-side
  // sıralıyoruz ki kullanıcı paylaştığı linkte aynı sırayı görür.
  const activeSort: VariationSort = (VARIATION_SORTS as string[]).includes(
    siralama ?? "",
  )
    ? (siralama as VariationSort)
    : "yeni";

  const sortedVariations = recipe.variations
    ? [...recipe.variations].sort((a, b) => {
        if (activeSort === "begeni") return b.likeCount - a.likeCount;
        if (activeSort === "kolay") {
          const aLen = Array.isArray(a.ingredients) ? a.ingredients.length : 0;
          const bLen = Array.isArray(b.ingredients) ? b.ingredients.length : 0;
          return aLen - bLen;
        }
        // "yeni", most recent first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    : [];

  // Görüntülenme sayısını arka planda artır, total (Recipe.viewCount)
  // + günlük bucket (RecipeViewDaily) ayrı ayrı fire-and-forget.
  incrementViewCount(slug).catch(() => {});
  logDailyView(recipe.id).catch(() => {});

  // "Bu hafta N kez görüntülendi" chip, son 7 gün RecipeViewDaily
  // aggregate. Sıfırsa chip hiç render edilmez (boş site sosyal kanıt
  // yerine gereksiz gürültü olmasın). Fire-and-forget ile yan yana
  // ama render için gerek olduğundan await'liyoruz.
  const viewsThisWeek = await getRecipeViewsLastDays(recipe.id, 7).catch(
    () => 0,
  );

  // AggregateRating yalnızca gerçek review varsa JSON-LD'ye eklenir,
  // Google structured-data abuse guard (fake/bookmark rating = penalty).
  // Reviews zaten ReviewsSection için fetch edilecek; burada sadece
  // summary paylaşıyoruz çünkü SEO head script render'ından önce gerek.
  const reviewSummary = await getRecipeReviews(recipe.id).then((r) => r.summary);
  const jsonLd = generateRecipeJsonLd(
    recipe,
    reviewSummary.count > 0
      ? { average: reviewSummary.average, count: reviewSummary.count }
      : null,
  );
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Ana Sayfa", url: "/" },
    { name: "Tarifler", url: "/tarifler" },
    {
      name: recipe.category.name,
      url: `/tarifler?kategori=${recipe.category.slug}`,
    },
    { name: translatedTitle, url: `/tarif/${recipe.slug}` },
  ]);
  const isAlcoholic = recipe.tags.some(({ tag }) => tag.slug === "alkollu");

  const content = (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Schema.org Recipe JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Schema.org BreadcrumbList JSON-LD, Google Search'te kartın
          altına "Ana Sayfa › Tarifler › Kategori › Tarif" şeridi çıkar. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Schema.org FAQPage JSON-LD, Google SERP'te FAQ rich results.
          "Kaç kişilik?", "Kaç kalori?", "Hangi alerjenler?" otomatik. */}
      {(() => {
        const faqJsonLd = generateRecipeFaqJsonLd(recipe);
        return faqJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        ) : null;
      })()}

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-text-muted" aria-label={t("breadcrumbAria")}>
        <Link href="/tarifler" className="hover:text-text">
          {tRecipe("pageTitle")}
        </Link>
        <span className="mx-2">›</span>
        <Link
          href={`/tarifler/${recipe.category.slug}`}
          className="hover:text-text"
        >
          {recipe.category.emoji} {recipe.category.name}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-text">{translatedTitle}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{recipe.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">{translatedTitle}</h1>
              {recipe.isFeatured && (
                <span
                  className="inline-flex items-center justify-center text-2xl"
                  title={tCard("editorsPickTitle")}
                  aria-label={tCard("editorsPick")}
                >
                  <span aria-hidden="true">⭐</span>
                </span>
              )}
            </div>
            <p className="mt-2 text-text-muted">{translatedDescription}</p>
          </div>
        </div>

        {/* Meta Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={recipe.difficulty === "EASY" ? "success" : recipe.difficulty === "MEDIUM" ? "warning" : "primary"}>
            {tCard(
              recipe.difficulty === "EASY"
                ? "difficultyEasy"
                : recipe.difficulty === "MEDIUM"
                  ? "difficultyMedium"
                  : "difficultyHard",
            )}
          </Badge>
          <Badge>⏱️ {formatTotalMinutes(recipe.totalMinutes, tCard)}</Badge>
          <Badge>{t("servingsLabel", { count: recipe.servingCount })}</Badge>
          {recipe.averageCalories && <Badge>~{recipe.averageCalories} kcal</Badge>}
          {recipe.cuisine && tCuisine.has(recipe.cuisine as CuisineCode) && (
            <Badge>
              {CUISINE_FLAG[recipe.cuisine as CuisineCode]} {tCuisine(recipe.cuisine as CuisineCode)}
            </Badge>
          )}
          {recipe._count.variations > 0 && (
            <Badge variant="info">
              {t("adaptationsBadge", { count: recipe._count.variations })}
            </Badge>
          )}
          {hasFullTranslation(recipe.translations, locale) && (
            <Badge variant="info" title={t("fullTranslationBadgeTitle")}>
              {t("fullTranslationBadge")}
            </Badge>
          )}
        </div>

        {/* Save + share actions */}
        <div className="mt-4 flex flex-wrap items-start gap-2 print:hidden">
          <SaveMenu
            recipeId={recipe.id}
            initialBookmarked={bookmarked}
            initialCollections={userCollections}
            ingredientCount={recipe.ingredients.length}
          />
          <ShareMenu
            title={translatedTitle}
            url={`${SITE_URL}/tarif/${recipe.slug}`}
            text={`${recipe.emoji ?? ""} ${translatedTitle}, Tarifle`}
            imageUrl={`${SITE_URL}/tarif/${recipe.slug}/pinterest-image?locale=${locale}`}
          />
        </div>

        {/* Tags, diet tags (vegan/vejetaryen) get a loud green badge so
            veg-aware visitors spot them at a glance; the rest stay as the
            muted #hashtag chips. Filter-by-slug keeps the list iteration
            single-pass. */}
        {recipe.tags.length > 0 && (
          // Semantic list so screen readers announce "N items" and each
          // tag becomes its own list item. An earlier <div><span> layout
          // leaked into textContent without separators ("#Misafir Sofrası
          // 🌱Vegan#Bütçe Dostu" concatenated), which degraded SEO text
          // extraction and accessibility.
          <ul
            role="list"
            aria-label={t("tagsAriaLabel")}
            className="mt-3 flex list-none flex-wrap gap-2 pl-0"
          >
            {recipe.tags.map(({ tag }) => {
              const isDiet = tag.slug === "vegan" || tag.slug === "vejetaryen";
              if (isDiet) {
                return (
                  <li key={tag.id}>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-accent-green/40 bg-accent-green/15 px-2.5 py-0.5 text-xs font-medium text-accent-green"
                      title={
                        tag.slug === "vegan"
                          ? t("tagTooltipVegan")
                          : t("tagTooltipVegetarian")
                      }
                    >
                      <span aria-hidden="true">🌱</span>
                      {tag.name}
                    </span>
                  </li>
                );
              }
              return (
                <li key={tag.id}>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">
                    #{tag.name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </header>

      {/* Image Placeholder */}
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={translatedTitle}
          className="mb-8 h-64 w-full rounded-xl object-cover sm:h-80"
        />
      ) : (
        <div className="mb-8 flex h-64 items-center justify-center rounded-xl bg-bg-card sm:h-80">
          <span className="text-8xl">{recipe.emoji}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3 print:hidden">
        <CookingMode
          steps={translatedSteps}
          recipeTitle={translatedTitle}
          recipeEmoji={recipe.emoji}
          ttsVoicePreference={userVoicePref.ttsVoice}
        />
        <PrintButton />
        <PdfDownloadButton slug={recipe.slug} />
      </div>

      {/* Pantry match: giris yapmis kullanicinin dolabi ile bu tarifin
          malzeme karsilastirmasi. Yeter mi, ne eksik?
          Altinda "Pisirdim" butonu ile pantry'den dusurme akisi. */}
      {/* Pisirdim rozet sistemi (oturum 23): toggle + "X kisi pisirdi"
          sosyal kanit. Anonymous kullanici icin gizlenmiyor (count daima
          gosterilir, login degilse butonun feedback'i "Onceden giris yap"). */}
      <div className="mb-4">
        <RecipeCookedToggle
          recipeId={recipe.id}
          slug={recipe.slug}
          initialCount={cookedCount}
          initialIsCooked={isCookedByMe}
          isLoggedIn={!!session?.user?.id}
        />
      </div>

      {pantryMatch && pantryMatch.total > 0 && (
        <div className="mb-8">
          <PantryMatchBadge summary={pantryMatch} />
          <CookedButton recipeId={recipe.id} defaultServings={recipe.servingCount} />
        </div>
      )}

      {/* Tarif zaman cizelgesi (oturum 23 yeni). Hazirlik + Bekleme/Marine
          + Pisirme orantili bar. Sauerbraten gibi uzun marine'li tariflerde
          "buna 3 gun lazim" gorsel olarak vurgulanir. */}
      <div className="mb-8">
        <RecipeTimeline
          prepMinutes={recipe.prepMinutes}
          cookMinutes={recipe.cookMinutes}
          totalMinutes={recipe.totalMinutes}
        />
      </div>

      {/* Ingredients + Steps, Side by Side on Desktop */}
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-bg-card p-5">
            <IngredientList
              ingredients={translatedIngredients}
              baseServingCount={recipe.servingCount}
              guides={ingredientGuides}
            />
            <div className="mt-3">
              <MeasureConverter locale={locale === "en" ? "en" : "tr"} />
            </div>
            {/* AI Asistan cross-link */}
            <Link
              href={`/ai-asistan?m=${recipe.ingredients
                .filter((i) => !i.isOptional)
                .slice(0, 5)
                .map((i) => encodeURIComponent(i.name.replace(/\(.*?\)/g, "").trim()))
                .join(",")}`}
              className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-accent-blue/30 bg-accent-blue/5 px-3 py-2 text-xs text-accent-blue transition-colors hover:border-accent-blue hover:bg-accent-blue/10 print:hidden"
            >
              <span aria-hidden="true">🧠</span>
              {t("aiCrossLink")}
            </Link>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-bg-card p-5">
            <RecipeSteps
              steps={translatedSteps}
              recipeTitle={translatedTitle}
            />
          </div>
        </div>
      </div>

      {/* Tip Note */}
      {translatedTipNote && (
        <div className="mt-6 rounded-xl border border-secondary/30 bg-secondary/10 p-4">
          <p className="text-sm">
            <span className="font-semibold text-secondary">{t("tipNoteLabel")}</span>{" "}
            {translatedTipNote}
          </p>
        </div>
      )}

      {/* Serving Suggestion */}
      {translatedServingSuggestion && (
        <div className="mt-4 rounded-xl border border-accent-green/30 bg-accent-green/10 p-4">
          <p className="text-sm">
            <span className="font-semibold text-accent-green">{t("servingSuggestionLabel")}</span>{" "}
            {translatedServingSuggestion}
          </p>
        </div>
      )}

      {/* Nutrition (Faz 2 ek alanlari, oturum 20) */}
      <div className="mt-6">
        <NutritionInfo
          calories={recipe.averageCalories}
          protein={recipe.protein}
          carbs={recipe.carbs}
          fat={recipe.fat}
          sugar={recipe.nutrition?.sugarPerServing ?? null}
          fiber={recipe.nutrition?.fiberPerServing ?? null}
          sodium={recipe.nutrition?.sodiumPerServing ?? null}
          satFat={recipe.nutrition?.satFatPerServing ?? null}
          matchedRatio={recipe.nutrition?.matchedRatio ?? null}
        />
      </div>

      {/* Hunger bar, Minecraft-esin tokluk göstergesi (porsiyon başı).
          Formula: src/lib/hunger-bar.ts; retrofit ile her tarif için
          hesaplanmış ve DB'ye yazılmış. */}
      {recipe.hungerBar != null && (
        <div className="mt-6">
          <HungerBar value={recipe.hungerBar} />
        </div>
      )}

      {/* Diyet uyumu kartı (oturum 20, DIET_SCORE_PLAN). Sadece login +
          dietProfile set + showDietBadge true + DB'de pre-computed skor
          var ise render eder. Skor 0-100 + breakdown + Beta uyarısı. */}
      {dietScore && userVoicePref.dietProfile && (
        <div className="mt-6">
          <DietFitCard dietSlug={userVoicePref.dietProfile} result={dietScore} />
        </div>
      )}

      {/* Allergen disclosure, collapsed by default so the info is
          available without dominating the page (first impression
          shouldn't be "dikkat! alerjen!" for every recipe). Native
          <details>/<summary> = accessible keyboard toggling + no JS.
          "İçerebilir" framing reflects the fact that inference is
          rule-based and can miss niche ingredients. */}
      {(() => {
        const allergenConfidence = computeAllergenConfidence(
          recipe.allergens,
          recipe.ingredients,
        );
        const showAllergenSection =
          recipe.allergens.length > 0 || !allergenConfidence.inSync;
        if (!showAllergenSection) return null;
        return (
          <details className="group mt-4 rounded-xl border border-border bg-bg-card">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm text-text-muted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
              <span>
                <span aria-hidden="true" className="mr-1.5">⚠</span>
                {t("allergenDisclosure")}
              </span>
              <span
                aria-hidden="true"
                className="text-xs transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="border-t border-border px-4 pb-4 pt-3">
              <AllergenBadges allergens={recipe.allergens} tone="subtle" />
              <AllergenConfidenceNote confidence={allergenConfidence} />
              <p className="mt-3 text-xs text-text-muted">
                {t("allergenDisclaimer")}
              </p>
            </div>
          </details>
        );
      })()}

      {/* User-uploaded photos (flag-gated).
          Server component UserPhotoGrid fetches VISIBLE photos; upload
          form only renders for email-verified logged-in users. Feature
          flag `userPhotosEnabled` şu an default kapalı, admin panelden
          açılana kadar bu bölüm render etmez (ilk ziyaretçiler "kimse
          foto yüklememiş" algısı kurmasın). */}
      {userPhotosEnabled && (
        <section className="mt-12 print:hidden">
          <h2 className="mb-4 font-heading text-xl font-bold">
            {t("userPhotosTitle")}
          </h2>
          {session?.user?.id && (
            <div className="mb-4">
              <UserPhotoUpload recipeId={recipe.id} />
            </div>
          )}
          <UserPhotoGrid recipeId={recipe.id} />
        </section>
      )}

      {/* Variations Section */}
      <section className="mt-12 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">
            {t("variationsTitle", { count: recipe._count.variations })}
          </h2>
          {sortedVariations.length > 1 && (
            <div className="flex items-center gap-1 text-sm">
              {VARIATION_SORTS.map((s) => {
                const isActive = s === activeSort;
                const href =
                  s === "yeni"
                    ? `/tarif/${recipe.slug}`
                    : `/tarif/${recipe.slug}?siralama=${s}`;
                return (
                  <Link
                    key={s}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      isActive
                        ? "bg-bg-card font-medium text-text"
                        : "text-text-muted hover:bg-bg-card"
                    }`}
                  >
                    {t(VARIATION_SORT_KEY[s])}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        {sortedVariations.length > 0 ? (
          <div className="mt-4 space-y-4">
            {sortedVariations.map((v) => (
              <VariationCard
                key={v.id}
                variation={v}
                isModerator={isModerator}
                isOwnVariation={session?.user?.id === v.authorId}
                isLikedByUser={likedVariationIds.has(v.id)}
                recipeSlug={recipe.slug}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-text-muted">{t("variationsEmpty")}</p>
          </div>
        )}

        <div className="mt-4">
          <VariationForm recipeId={recipe.id} recipeSlug={recipe.slug} />
        </div>
      </section>

      {/* Reviews, 1-5 yıldız + opsiyonel yorum. AggregateRating JSON-LD
          için metaData'da da hesaplanır. Print mode'da gizlenir (yorumlar
          bir tarifi yazılı kağıda basarken bilgi değeri katmıyor). */}
      <div className="print:hidden">
        <ReviewsSection recipeId={recipe.id} recipeSlug={recipe.slug} />
      </div>

      {/* Basit / lüks varyant paneli: aynı kategori + type pool'undan
          daha az / daha çok karmaşıklıkta tarif önerir. */}
      <div className="print:hidden">
        <RecipeVariantsPanel
          simpler={variants.simpler}
          fancier={variants.fancier}
        />
      </div>

      {/* Similar recipes, kural tabanlı öneri (kategori + type + tag
          ortaklığı). Print mode gizler, uyarlama bölümünden sonra gelir. */}
      <div className="print:hidden">
        <SimilarRecipes recipes={similarRecipes} />
      </div>

      {/* Cuisine discovery link */}
      {recipe.cuisine && tCuisine.has(recipe.cuisine as CuisineCode) && (
        <div className="mt-6 print:hidden">
          <Link
            href={`/tarifler?mutfak=${recipe.cuisine}`}
            className="group inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm transition-all hover:border-primary hover:shadow-sm"
          >
            <span className="text-lg">{CUISINE_FLAG[recipe.cuisine as CuisineCode]}</span>
            <span className="text-text-muted group-hover:text-text">
              {t("cuisineDiscoveryLink", {
                label: tCuisine(recipe.cuisine as CuisineCode),
              })}
            </span>
          </Link>
        </div>
      )}

      {/* View Count + This Week. Social proof eşiği: viewCount < 30
          gösterilmez; düşük sayı yeni/az ziyaret edilmiş tarif için
          zayıf sinyal verir (GPT audit'inde "düşük sosyal kanıt göster
          mekten gizlemek daha iyi" önerisi). viewsThisWeek hali hazırda
          > 0 filterli. İkisi de eşik altı ise sayaç bloğu tümüyle
          gizlenir. */}
      {(recipe.viewCount >= VIEW_COUNT_MIN_DISPLAY || viewsThisWeek > 0) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-text-muted print:hidden">
          {recipe.viewCount >= VIEW_COUNT_MIN_DISPLAY && (
            <span className="inline-flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              {t("viewCount", {
                count: recipe.viewCount.toLocaleString(locale === "tr" ? "tr-TR" : "en-US"),
              })}
            </span>
          )}
          {viewsThisWeek > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              {t("viewsThisWeek", {
                count: viewsThisWeek.toLocaleString(locale === "tr" ? "tr-TR" : "en-US"),
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // AgeGate v2 overlay: content her zaman render edilir (SSR HTML'inde
  // tarif schema + adimlar + malzemeler mevcut, Google bot indexler).
  // Alkollu tarifse gate overlay client-side mount'ta kullanici onayi
  // gelene kadar icerigin ustune dusuyor.
  return (
    <>
      {isAlcoholic && <AgeGate />}
      {content}
    </>
  );
}

function formatTotalMinutes(
  minutes: number,
  tCard: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  if (minutes < 60) return tCard("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return tCard("hoursShort", { n: hours });
  return tCard("hoursMinutes", { h: hours, m: remaining });
}
