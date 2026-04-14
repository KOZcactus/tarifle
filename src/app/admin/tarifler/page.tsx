import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDifficultyLabel } from "@/lib/utils";

export const metadata = { title: "Tarifler | Yönetim Paneli" };

export default async function AdminRecipesPage() {
  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      emoji: true,
      difficulty: true,
      status: true,
      viewCount: true,
      isFeatured: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: { select: { variations: true, bookmarks: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="mb-4 font-heading text-xl font-bold">
        Tarifler ({recipes.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="pb-3 pr-4">Tarif</th>
              <th className="pb-3 pr-4">Kategori</th>
              <th className="pb-3 pr-4">Zorluk</th>
              <th className="pb-3 pr-4">Durum</th>
              <th className="pb-3 pr-4 text-right">Görüntülenme</th>
              <th className="pb-3 pr-4 text-right">Uyarlama</th>
              <th className="pb-3 text-right">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recipes.map((r) => (
              <tr key={r.id} className="hover:bg-bg-card">
                <td className="py-3 pr-4">
                  <Link
                    href={`/tarif/${r.slug}`}
                    className="font-medium text-text hover:text-primary"
                  >
                    {r.emoji} {r.title}
                    {r.isFeatured && (
                      <span className="ml-1 text-xs text-secondary">★</span>
                    )}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-text-muted">{r.category.name}</td>
                <td className="py-3 pr-4 text-text-muted">{getDifficultyLabel(r.difficulty)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      r.status === "PUBLISHED"
                        ? "bg-accent-green/10 text-accent-green"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right text-text-muted">
                  {r.viewCount.toLocaleString("tr-TR")}
                </td>
                <td className="py-3 pr-4 text-right text-text-muted">
                  {r._count.variations}
                </td>
                <td className="py-3 text-right text-text-muted">
                  {r._count.bookmarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
