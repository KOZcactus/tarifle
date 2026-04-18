import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminCategories } from "@/lib/queries/admin";
import { CreateCategoryForm } from "@/components/admin/CreateCategoryForm";
import { CategoryRow } from "@/components/admin/CategoryRow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pageTitles");
  return { title: t("categories"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, t] = await Promise.all([
    getAdminCategories(),
    getTranslations("admin.categories"),
  ]);

  const totalRecipes = categories.reduce((a, c) => a + c._count.recipes, 0);
  const orphans = categories.filter((c) => c._count.recipes === 0).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          {t("headingWithCount", { count: categories.length })}
        </h2>
        <p className="text-xs text-text-muted">
          {t("statsLine", { total: totalRecipes, orphans })}
        </p>
      </div>

      <CreateCategoryForm />

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="grid grid-cols-[60px_1fr_90px_90px_60px] gap-3 border-b border-border bg-bg-elevated/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          <span>{t("colEmoji")}</span>
          <span>{t("colNameSlug")}</span>
          <span>{t("colOrder")}</span>
          <span className="text-right">{t("colUsage")}</span>
          <span className="text-right">{t("colDelete")}</span>
        </div>
        {categories.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <CategoryRow
                key={c.id}
                id={c.id}
                name={c.name}
                slug={c.slug}
                emoji={c.emoji}
                sortOrder={c.sortOrder}
                recipeCount={c._count.recipes}
                childrenCount={c._count.children}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
