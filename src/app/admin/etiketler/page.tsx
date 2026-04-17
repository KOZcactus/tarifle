import { getAdminTags } from "@/lib/queries/admin";
import { CreateTagForm } from "@/components/admin/CreateTagForm";
import { TagRow } from "@/components/admin/TagRow";

export const metadata = {
  title: "Etiketler | Yönetim Paneli",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await getAdminTags();

  const totalUsage = tags.reduce((a, t) => a + t._count.recipeTags, 0);
  const orphans = tags.filter((t) => t._count.recipeTags === 0).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          Etiketler ({tags.length})
        </h2>
        <p className="text-xs text-text-muted">
          {totalUsage} toplam kullanım · {orphans} boş etiket
        </p>
      </div>

      <CreateTagForm />

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        {tags.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            Henüz etiket yok.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tags.map((t) => (
              <TagRow
                key={t.id}
                id={t.id}
                name={t.name}
                slug={t.slug}
                usageCount={t._count.recipeTags}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
