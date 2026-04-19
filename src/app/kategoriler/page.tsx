import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getCategoriesForLanding } from "@/lib/queries/category";
import {
  CUISINE_CODES,
  CUISINE_FLAG,
  CUISINE_LABEL,
  CUISINE_SLUG,
} from "@/lib/cuisines";
import { DIETS } from "@/lib/diets";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.categoriesPage");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/kategoriler" },
  };
}

export default async function KategorilerPage() {
  const [categories, t, tLanding, locale] = await Promise.all([
    getCategoriesForLanding(),
    getTranslations("categoriesLanding"),
    getTranslations("landing"),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        <p className="mt-1 text-xs text-text-muted">
          {t("totalCount", { total: categories.length })}
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-text-muted">{t("empty")}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/tarifler/${c.slug}`}
                className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-primary hover:bg-bg-elevated"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-4xl leading-none" aria-hidden="true">
                    {c.emoji ?? "🍽"}
                  </span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary">
                    {t("recipeCount", { count: c._count.recipes })}
                  </span>
                </div>
                <div className="mt-1">
                  <h2 className="font-heading text-lg font-semibold text-text group-hover:text-primary">
                    {c.name}
                  </h2>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                      {c.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Cross-link: mutfak + diyet chip'leri. Kategori sayfası zaten 17
          kategori kartı gösterir; aşağıya 24 mutfak + 5 diyet link'i
          internal link graph'i güçlendirir ve user aynı sayfadan
          alternate browse dimension'ına geçebilir. */}
      <section className="mt-16 border-t border-border pt-8">
        <h2 className="mb-3 text-sm font-semibold text-text">
          {tLanding("relatedCuisinesHeading")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {CUISINE_CODES.map((c) => (
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
          {tLanding("relatedDietsHeading")}
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
