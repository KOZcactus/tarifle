import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminTags } from "@/lib/queries/admin";
import { CreateTagForm } from "@/components/admin/CreateTagForm";
import { TagRow } from "@/components/admin/TagRow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pageTitles");
  return { title: t("tags"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const [tags, t] = await Promise.all([
    getAdminTags(),
    getTranslations("admin.tags"),
  ]);

  const totalUsage = tags.reduce((a, tag) => a + tag._count.recipeTags, 0);
  const orphans = tags.filter((tag) => tag._count.recipeTags === 0).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          {t("headingWithCount", { count: tags.length })}
        </h2>
        <p className="text-xs text-text-muted">
          {t("statsLine", { total: totalUsage, orphans })}
        </p>
      </div>

      <CreateTagForm />

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        {tags.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tags.map((tag) => (
              <TagRow
                key={tag.id}
                id={tag.id}
                name={tag.name}
                slug={tag.slug}
                usageCount={tag._count.recipeTags}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
