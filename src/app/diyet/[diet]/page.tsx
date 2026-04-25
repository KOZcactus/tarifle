import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Pagination } from "@/components/listing/Pagination";
import { LandingBreadcrumb } from "@/components/landing/LandingBreadcrumb";
import { getRecipes } from "@/lib/queries/recipe";
import { auth } from "@/lib/auth";
import { getDietBadgesIfApplicable } from "@/lib/queries/diet-score";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { buildRecipeListSchema, buildFaqPageSchema } from "@/lib/seo/structured-data";
import { getLandingCopy } from "@/lib/seo/landing-copy";
import { LandingIntroAndFaq } from "@/components/landing/LandingIntroAndFaq";
import { DIETS, dietConfigBySlug } from "@/lib/diets";
import { CUISINE_CODES, CUISINE_FLAG, CUISINE_LABEL, CUISINE_SLUG } from "@/lib/cuisines";

interface PageProps {
  params: Promise<{ diet: string }>;
  searchParams: Promise<{ page?: string }>;
}

/** 5 diet slug build time pre-render. */
export async function generateStaticParams(): Promise<{ diet: string }[]> {
  return DIETS.map((d) => ({ diet: d.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { diet } = await params;
  const cfg = dietConfigBySlug(diet);
  if (!cfg) return { title: "Bulunamadı" };

  const locale = await getLocale();
  const label = locale === "en" ? cfg.labelEn : cfg.labelTr;
  const description = locale === "en" ? cfg.descriptionEn : cfg.descriptionTr;

  const t = await getTranslations("landing");
  const { total } = await getRecipes({
    tagSlugs: cfg.tagSlug ? [cfg.tagSlug] : undefined,
    excludeAllergens: cfg.excludeAllergen ? [cfg.excludeAllergen] : undefined,
    limit: 1,
  });

  return {
    title: t("dietMetaTitle", { label, count: total }),
    description: t("dietMetaDescription", {
      label,
      count: total,
      description: description.slice(0, 120),
    }),
    alternates: { canonical: `/diyet/${diet}` },
  };
}

export default async function DiyetLandingPage({
  params,
  searchParams,
}: PageProps) {
  const { diet } = await params;
  const sp = await searchParams;
  const cfg = dietConfigBySlug(diet);
  if (!cfg) notFound();

  const locale = await getLocale();
  const label = locale === "en" ? cfg.labelEn : cfg.labelTr;
  const description = locale === "en" ? cfg.descriptionEn : cfg.descriptionTr;

  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [{ recipes, total }, t, tCommon] = await Promise.all([
    getRecipes({
      tagSlugs: cfg.tagSlug ? [cfg.tagSlug] : undefined,
      excludeAllergens: cfg.excludeAllergen ? [cfg.excludeAllergen] : undefined,
      limit: ITEMS_PER_PAGE,
      offset,
    }),
    getTranslations("landing"),
    getTranslations("recipes"),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  // Diyet badge'leri (oturum 20)
  const session = await auth();
  const dietBadges = await getDietBadgesIfApplicable(
    session?.user?.id ?? null,
    recipes.map((r) => r.id),
  );

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: t("breadcrumbHome"), url: "/" },
    { name: t("breadcrumbDiets"), url: "/tarifler" },
    { name: label, url: `/diyet/${diet}` },
  ]);

  const recipeListJsonLd = buildRecipeListSchema({
    name: `${label} Tarifleri`,
    description: description.slice(0, 200),
    items: recipes.map((r) => ({ slug: r.slug, title: r.title })),
  });

  const relatedDiets = DIETS.filter((d) => d.slug !== diet);
  // Cuisine cross-link, küçük bir set rotasyon, SEO link graph.
  const featuredCuisines = CUISINE_CODES.slice(0, 8);

  const landingCopy = getLandingCopy("diet", diet);
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
          { label: t("breadcrumbDiets"), href: "/tarifler" },
          { label },
        ]}
      />

      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-5xl" aria-hidden="true">
            {cfg.emoji}
          </span>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("dietPageTitle", { label })}
          </h1>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
          {description}
        </p>
        <p className="mt-2 text-xs text-text-muted">
          {t("totalCount", { count: total })}
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
              basePath={`/diyet/${diet}`}
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={sp}
              t={tCommon}
              totalItems={total}
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

      <section className="mt-16 border-t border-border pt-8">
        <h2 className="mb-3 text-sm font-semibold text-text">
          {t("relatedDietsHeading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {relatedDiets.map((d) => (
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

        <h2 className="mb-3 mt-6 text-sm font-semibold text-text">
          {t("relatedCuisinesHeading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {featuredCuisines.map((c) => (
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
      </section>
    </div>
  );
}
