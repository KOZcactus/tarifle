import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { AllergenFilter } from "@/components/search/AllergenFilter";
import { DietFilter } from "@/components/search/DietFilter";
import { CuisineFilter } from "@/components/search/CuisineFilter";
import { Pagination } from "@/components/listing/Pagination";
import { getCategoryBySlug } from "@/lib/queries/category";
import { getRecipes, resolveDefaultAllergenAvoidances } from "@/lib/queries/recipe";
import { auth } from "@/lib/auth";
import { generateBreadcrumbJsonLd, generateCategoryFaqJsonLd } from "@/lib/seo";
import { ALLERGEN_ORDER } from "@/lib/allergens";
import { CUISINE_CODES, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import type { Metadata } from "next";

interface KategoriPageProps {
  params: Promise<{ kategori: string }>;
  searchParams: Promise<{
    mutfak?: string | string[];
    alerjen?: string | string[];
    etiket?: string | string[];
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: KategoriPageProps): Promise<Metadata> {
  const { kategori } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(kategori);
  if (!category) return { title: "Kategori Bulunamadı" };

  // Page 2+ sayfalarını indekslemeyelim — Google duplicate content kaygısını
  // düşürür, canonical tek sayfa kategori landing'inde kalır. Page 1 ise
  // indekslenebilir (canonical zaten /tarifler/[kategori]'ye eş).
  const pageNum = parseInt(sp.page ?? "1", 10) || 1;
  const isPaginated = pageNum > 1;

  return {
    title: `${category.name} Tarifleri`,
    description: `${category.name} kategorisindeki tüm tarifler. ${category.emoji ?? ""}`,
    alternates: {
      canonical: `/tarifler/${kategori}`,
    },
    robots: isPaginated ? { index: false, follow: true } : undefined,
  };
}

export default async function KategoriPage({ params, searchParams }: KategoriPageProps) {
  const { kategori } = await params;
  const sp = await searchParams;
  const [category, t, tFilters, tCuisine, tAllergen] = await Promise.all([
    getCategoryBySlug(kategori),
    getTranslations("recipes"),
    getTranslations("filters"),
    getTranslations("cuisines"),
    getTranslations("allergens"),
  ]);

  if (!category) notFound();

  // Parse cuisine filter
  const rawCuisines = sp.mutfak
    ? Array.isArray(sp.mutfak)
      ? sp.mutfak
      : [sp.mutfak]
    : [];
  const cuisines = rawCuisines.filter((c): c is CuisineCode =>
    (CUISINE_CODES as readonly string[]).includes(c),
  );

  // Parse allergen exclusion — URL'de ?alerjen= yoksa logged-in user'ın
  // User.allergenAvoidances tercihini default olarak uygula (güvenlik
  // default'u). URL'de seçim varsa kullanıcı override kabul edilir.
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

  // Parse diet tag filter
  const tagSlugs = sp.etiket
    ? Array.isArray(sp.etiket)
      ? sp.etiket
      : [sp.etiket]
    : undefined;

  // Pagination — 1-indexed page param, falls back to 1.
  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { recipes, total } = await getRecipes({
    categorySlug: kategori,
    cuisines: cuisines.length > 0 ? cuisines : undefined,
    excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined,
    tagSlugs,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Ana Sayfa", url: "/" },
    { name: "Tarifler", url: "/tarifler" },
    { name: category.name, url: `/tarifler/${kategori}` },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Schema.org BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Schema.org FAQPage JSON-LD — kategori SSS rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCategoryFaqJsonLd(category.name, total)),
        }}
      />

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{category.emoji}</span>
          <div>
            <h1 className="font-heading text-3xl font-bold">{category.name}</h1>
            <p className="mt-1 text-text-muted">{t("totalSimple", { total })}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <Suspense>
          <AllergenFilter selected={excludeAllergens} />
        </Suspense>
        <Suspense>
          <DietFilter activeTagSlugs={tagSlugs ?? []} />
        </Suspense>
        <Suspense>
          <CuisineFilter selected={cuisines} />
        </Suspense>
      </div>

      {/* Active filter chips */}
      {(cuisines.length > 0 || excludeAllergens.length > 0 || (tagSlugs && tagSlugs.length > 0)) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">{tFilters("activeLabel")}</span>
          {cuisines.map((c) => (
            <Link
              key={c}
              href={`/tarifler/${kategori}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              {CUISINE_FLAG[c as CuisineCode]}{" "}
              {tCuisine.has(c as CuisineCode) ? tCuisine(c as CuisineCode) : c}
              <span aria-hidden="true">×</span>
            </Link>
          ))}
          {excludeAllergens.map((a) => (
            <Link
              key={a}
              href={`/tarifler/${kategori}`}
              className="inline-flex items-center gap-1 rounded-full border border-error/30 bg-error/5 px-2.5 py-1 text-xs font-medium text-error hover:bg-error/10"
            >
              {tFilters("excludedSuffix", {
                label: tAllergen.has(a) ? tAllergen(a) : a,
              })}
              <span aria-hidden="true">×</span>
            </Link>
          ))}
          {tagSlugs?.map((tag) => (
            <Link
              key={tag}
              href={`/tarifler/${kategori}`}
              className="inline-flex items-center gap-1 rounded-full border border-accent-green/30 bg-accent-green/5 px-2.5 py-1 text-xs font-medium text-accent-green hover:bg-accent-green/10"
            >
              #{tag}
              <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link
            href={`/tarifler/${kategori}`}
            className="text-[11px] text-text-muted hover:text-primary"
          >
            {tFilters("clearAll")}
          </Link>
        </div>
      )}

      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <>
          {/* Heading hierarchy: h1 (kategori adı) → h2 (sr-only) → h3
              (RecipeCard). Lighthouse heading-order fix; sadece ekran
              okuyucu görür. */}
          <h2 className="sr-only">
            {t("categorySrHeader", { category: category.name })}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {/* Pagination — total > ITEMS_PER_PAGE olan kategorilerde 2+ sayfa */}
          {totalPages > 1 && (
            <Pagination
              basePath={`/tarifler/${kategori}`}
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={sp}
              t={t}
              totalItems={total}
              pageSize={ITEMS_PER_PAGE}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl">{category.emoji}</span>
          <h2 className="mt-4 font-heading text-xl font-semibold">{t("empty.title")}</h2>
          <p className="mt-2 text-sm text-text-muted">
            {cuisines.length > 0 || excludeAllergens.length > 0
              ? t("empty.filtersMessage")
              : t("empty.categoryMessage")}
          </p>
          {(cuisines.length > 0 || excludeAllergens.length > 0) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href={`/tarifler/${kategori}`}
                className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {t("empty.clearFilters")}
              </Link>
              <Link
                href="/tarifler"
                className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {t("empty.backToAll")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
