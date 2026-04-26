import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getDietBadgesIfApplicable } from "@/lib/queries/diet-score";
import { Pagination } from "@/components/listing/Pagination";
import { LandingBreadcrumb } from "@/components/landing/LandingBreadcrumb";
import {
  CUISINE_CODES,
  CUISINE_DESCRIPTION_EN,
  CUISINE_DESCRIPTION_TR,
  CUISINE_FLAG,
  CUISINE_LABEL,
  CUISINE_SLUG,
  cuisineCodeBySlug,
} from "@/lib/cuisines";
import { getRecipes, resolveDefaultAllergenAvoidances } from "@/lib/queries/recipe";
import { getCuisineStats } from "@/lib/queries/cuisine-stats";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { ALLERGEN_ORDER } from "@/lib/allergens";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { buildRecipeListSchema, buildFaqPageSchema } from "@/lib/seo/structured-data";
import { getLandingCopy } from "@/lib/seo/landing-copy";
import { LandingIntroAndFaq } from "@/components/landing/LandingIntroAndFaq";
import { DIETS } from "@/lib/diets";
import { getLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ cuisine: string }>;
  searchParams: Promise<{ page?: string; alerjen?: string | string[] }>;
}

/**
 * Tüm cuisine slug'ları için statik pre-rendering. Next build time'da
 * 24 sayfa oluşur; revalidate yok (ISR gerekmiyor, içerik nadir değişir).
 */
export async function generateStaticParams(): Promise<{ cuisine: string }[]> {
  return CUISINE_CODES.map((code) => ({ cuisine: CUISINE_SLUG[code] }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { cuisine } = await params;
  const code = cuisineCodeBySlug(cuisine);
  if (!code) return { title: "Bulunamadı" };

  const locale = await getLocale();
  const label = CUISINE_LABEL[code];
  const description =
    locale === "en" ? CUISINE_DESCRIPTION_EN[code] : CUISINE_DESCRIPTION_TR[code];

  const t = await getTranslations("landing");

  // User-agnostic count: home page `getCuisineStats` ile aynı kaynak.
  // Önceki davranış `getRecipes({ cuisines: [code], limit: 1 }).total` idi,
  // ama o hook detay sayfada allergen filter uygulanıyordu; metadata her
  // kullanıcıya aynı başlığı göstermeli. GPT dış audit'inde "ana sayfa
  // 1541 vs mutfak detay 1407" olarak yakalanan tutarsızlığın kök nedeni.
  // Fallback: getCuisineStats homepage için ≥3 tarifli cuisine'leri
  // gösterir (filter), yeni eklenen tn/ar gibi 1-2 tarifli cuisine'ler
  // stats'ta yok. Bu durumda direkt prisma.count ile gerçek değeri çek
  // (title-body tutarsızlığı, oturum 25 fix).
  const stats = await getCuisineStats();
  const total =
    stats.find((s) => s.code === code)?.count ??
    (await prisma.recipe.count({
      where: { status: "PUBLISHED", cuisine: code },
    }));

  return {
    title: t("cuisineMetaTitle", { label, count: total }),
    description: t("cuisineMetaDescription", {
      label,
      count: total,
      description: description.slice(0, 120),
    }),
    alternates: { canonical: `/mutfak/${cuisine}` },
  };
}

export default async function MutfakLandingPage({
  params,
  searchParams,
}: PageProps) {
  const { cuisine } = await params;
  const sp = await searchParams;
  const code = cuisineCodeBySlug(cuisine);
  if (!code) notFound();

  const locale = await getLocale();
  const label = CUISINE_LABEL[code];
  const flag = CUISINE_FLAG[code];
  const description =
    locale === "en" ? CUISINE_DESCRIPTION_EN[code] : CUISINE_DESCRIPTION_TR[code];

  // Allergen exclusion, URL'de seçim varsa onu kullan, yoksa logged-in
  // user'ın User.allergenAvoidances tercihleri (security default).
  const rawAllergens = sp.alerjen
    ? Array.isArray(sp.alerjen)
      ? sp.alerjen
      : [sp.alerjen]
    : [];
  const urlExcludeAllergens = rawAllergens.filter(
    (a): a is (typeof ALLERGEN_ORDER)[number] =>
      (ALLERGEN_ORDER as readonly string[]).includes(a),
  );
  const session = await auth();
  const excludeAllergens = await resolveDefaultAllergenAvoidances({
    userId: session?.user?.id ?? null,
    explicitAllergens: urlExcludeAllergens,
  });

  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [{ recipes, total: filteredTotal }, t, tCommon, cuisineStats] =
    await Promise.all([
      getRecipes({
        cuisines: [code],
        excludeAllergens:
          excludeAllergens.length > 0 ? excludeAllergens : undefined,
        limit: ITEMS_PER_PAGE,
        offset,
      }),
      getTranslations("landing"),
      getTranslations("recipes"),
      getCuisineStats(),
    ]);

  // User-agnostic total (home + metadata ile aynı kaynak). Header ve
  // pagination'da bu gösterilir; listede kullanıcının allergen
  // tercihlerine göre filtrelenmiş `filteredTotal` kalabilir.
  const agnosticTotal =
    cuisineStats.find((s) => s.code === code)?.count ?? filteredTotal;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / ITEMS_PER_PAGE));

  const dietBadges = await getDietBadgesIfApplicable(
    session?.user?.id ?? null,
    recipes.map((r) => r.id),
  );

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: t("breadcrumbHome"), url: "/" },
    { name: t("breadcrumbCuisines"), url: "/tarifler" },
    { name: label, url: `/mutfak/${cuisine}` },
  ]);

  // ItemList JSON-LD: Google kategori/mutfak sayfasını Recipe Carousel
  // eligibility'si için "tarif koleksiyonu" olarak okur. Görünür
  // sayfadaki recipes array'ini pointer list haline getirir.
  const recipeListJsonLd = buildRecipeListSchema({
    name: t("cuisinePageTitle", { label }),
    description: description.slice(0, 200),
    items: recipes.map((r) => ({ slug: r.slug, title: r.title })),
  });

  // Related cuisines, mevcut kodu hariç diğer 5 rastgele mutfak.
  // Simple pick: slug alfabetik sırada önceki/sonraki + ek çeşitlilik.
  const relatedCuisines = CUISINE_CODES.filter((c) => c !== code).slice(0, 8);

  // Mod C SEO copy (intro + 4 FAQ + FAQPage JSON-LD), varsa ek render.
  // 38 item Codex teslim docs/seo-copy-v1.json'da; eksik slug için null
  // dönerse mevcut metin (description) yeterli kalır.
  const landingCopy = getLandingCopy("cuisine", cuisine);
  const faqJsonLd = landingCopy ? buildFaqPageSchema(landingCopy.faqs) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {recipes.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeListJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <LandingBreadcrumb
        items={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbCuisines"), href: "/tarifler" },
          { label },
        ]}
      />

      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-5xl" aria-hidden="true">
            {flag}
          </span>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("cuisinePageTitle", { label })}
          </h1>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
          {description}
        </p>
        <p className="mt-2 text-xs text-text-muted">
          {t("totalCount", { count: agnosticTotal })}
        </p>
      </header>

      {landingCopy && (
        <LandingIntroAndFaq copy={landingCopy} faqHeading={t("faqHeading")} />
      )}

      {recipes.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                dietBadge={dietBadges.get(recipe.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              basePath={`/mutfak/${cuisine}`}
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={sp}
              t={tCommon}
              totalItems={filteredTotal}
              pageSize={ITEMS_PER_PAGE}
            />
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <h2 className="font-heading text-xl font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-text-muted">{t("emptyBody")}</p>
          <Link
            href="/tarifler"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            {t("viewAllRecipes")}
          </Link>
        </div>
      )}

      {/* Cross-linking, internal navigation + SEO link graph. 8 mutfak +
          5 diet link'i footer'ın üstüne, SEO crawl derinliğini azaltır. */}
      <section className="mt-16 border-t border-border pt-8">
        <h2 className="mb-3 text-sm font-semibold text-text">
          {t("relatedCuisinesHeading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {relatedCuisines.map((c) => (
            <Link
              key={c}
              href={`/mutfak/${CUISINE_SLUG[c]}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <span aria-hidden="true">{CUISINE_FLAG[c]}</span>
              {CUISINE_LABEL[c]}
            </Link>
          ))}
        </div>

        <h2 className="mb-3 mt-6 text-sm font-semibold text-text">
          {t("relatedDietsHeading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <Link
              key={d.slug}
              href={`/diyet/${d.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <span aria-hidden="true">{d.emoji}</span>
              {locale === "en" ? d.labelEn : d.labelTr}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
