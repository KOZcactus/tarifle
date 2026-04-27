import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Pagination } from "@/components/listing/Pagination";
import { LandingBreadcrumb } from "@/components/landing/LandingBreadcrumb";
import { getRecipes, resolveDefaultAllergenAvoidances } from "@/lib/queries/recipe";
import { getTags } from "@/lib/queries/tag";
import { getDietBadgesIfApplicable } from "@/lib/queries/diet-score";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { ALLERGEN_ORDER } from "@/lib/allergens";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

interface PageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string; alerjen?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const dbTag = await prisma.tag.findUnique({ where: { slug: tag } });
  if (!dbTag) return { title: "Bulunamadı" };

  const t = await getTranslations("landing");
  const { total } = await getRecipes({ tagSlugs: [tag], limit: 1 });

  return {
    title: t("tagMetaTitle", { label: dbTag.name, count: total }),
    description: t("tagMetaDescription", { label: dbTag.name, count: total }),
    alternates: { canonical: `/etiket/${tag}` },
  };
}

export default async function EtiketLandingPage({
  params,
  searchParams,
}: PageProps) {
  const { tag } = await params;
  const sp = await searchParams;
  const dbTag = await prisma.tag.findUnique({ where: { slug: tag } });
  if (!dbTag) notFound();

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

  const [{ recipes, total }, t, tCommon, allTags] = await Promise.all([
    getRecipes({
      tagSlugs: [tag],
      excludeAllergens:
        excludeAllergens.length > 0 ? excludeAllergens : undefined,
      limit: ITEMS_PER_PAGE,
      offset,
    }),
    getTranslations("landing"),
    getTranslations("recipes"),
    getTags(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const dietBadges = await getDietBadgesIfApplicable(
    session?.user?.id ?? null,
    recipes.map((r) => r.id),
  );

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: t("breadcrumbHome"), url: "/" },
    { name: t("breadcrumbTags"), url: "/tarifler" },
    { name: dbTag.name, url: `/etiket/${tag}` },
  ]);

  // Related tags, mevcut etiketi hariç en popüler 10 tag.
  const relatedTags = allTags.filter((t) => t.slug !== tag).slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\u003c") }}
      />

      <LandingBreadcrumb
        items={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbTags"), href: "/tarifler" },
          { label: dbTag.name },
        ]}
      />

      <header className="mb-8">
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono text-xl text-primary"
            aria-hidden="true"
          >
            #
          </span>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("tagPageTitle", { label: dbTag.name })}
          </h1>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {t("totalCount", { count: total })}
        </p>
      </header>

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
              basePath={`/etiket/${tag}`}
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
          {t("relatedTagsHeading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {relatedTags.map((rt) => (
            <Link
              key={rt.slug}
              href={`/etiket/${rt.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <span aria-hidden="true" className="text-primary/60">
                #
              </span>
              {rt.name}
              <span className="tabular-nums text-text-muted/60">
                {rt._count.recipeTags}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
