import Link from "next/link";
import {
  getAdminRecipesList,
  type RecipeSortKey,
  type AdminRecipeListParams,
} from "@/lib/queries/admin";
import { getDifficultyLabel } from "@/lib/utils";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { PaginationBar } from "@/components/admin/PaginationBar";

export const metadata = { title: "Tarifler | Yönetim Paneli" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const STATUSES = ["PUBLISHED", "DRAFT", "PENDING_REVIEW", "HIDDEN", "REJECTED"] as const;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstStr(
  raw: string | string[] | undefined,
  fallback = "",
): string {
  if (Array.isArray(raw)) return raw[0] ?? fallback;
  return raw ?? fallback;
}

export default async function AdminRecipesPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const sortRaw = firstStr(sp.sort, "createdAt");
  const sort: RecipeSortKey = (
    ["createdAt", "viewCount", "variations", "bookmarks"].includes(sortRaw)
      ? sortRaw
      : "createdAt"
  ) as RecipeSortKey;
  const order: "asc" | "desc" = firstStr(sp.order, "desc") === "asc" ? "asc" : "desc";
  const status = firstStr(sp.status);
  const search = firstStr(sp.q);
  const page = Math.max(1, parseInt(firstStr(sp.page, "1"), 10) || 1);

  const params: AdminRecipeListParams = {
    sort,
    order,
    status: status || undefined,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { recipes, total } = await getAdminRecipesList(params);

  // Helper — preserve other search params when building next URL
  function buildHref(overrides: Record<string, string | number | null>) {
    const out = new URLSearchParams();
    if (sort !== "createdAt") out.set("sort", sort);
    if (order !== "desc") out.set("order", order);
    if (status) out.set("status", status);
    if (search) out.set("q", search);
    if (page > 1) out.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "" || v === 0) {
        out.delete(k);
      } else {
        out.set(k, String(v));
      }
    }
    const qs = out.toString();
    return qs ? `/admin/tarifler?${qs}` : "/admin/tarifler";
  }

  function sortHref(nextSort: RecipeSortKey, nextOrder: "asc" | "desc") {
    return buildHref({
      sort: nextSort === "createdAt" ? null : nextSort,
      order: nextOrder === "desc" ? null : nextOrder,
      page: null, // reset to page 1 when sort changes
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          Tarifler ({total.toLocaleString("tr-TR")})
        </h2>
      </div>

      {/* Filters */}
      <form
        method="get"
        action="/admin/tarifler"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <input
          name="q"
          defaultValue={search}
          placeholder="Tarif adı ara..."
          aria-label="Tarif adı ara"
          className="min-w-[200px] rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Durum"
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm durumlar</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {/* Preserve sort on submit */}
        {sort !== "createdAt" && <input type="hidden" name="sort" value={sort} />}
        {order !== "desc" && <input type="hidden" name="order" value={order} />}
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Uygula
        </button>
        {(search || status) && (
          <Link
            href="/admin/tarifler"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-bg-elevated"
          >
            Temizle
          </Link>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                Tarif
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                Kategori
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                Zorluk
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                Durum
              </th>
              <SortableHeader<RecipeSortKey>
                label="Görüntülenme"
                sortKey="viewCount"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<RecipeSortKey>
                label="Uyarlama"
                sortKey="variations"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<RecipeSortKey>
                label="Kayıt"
                sortKey="bookmarks"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                Yorum
              </th>
              <SortableHeader<RecipeSortKey>
                label="Eklendi"
                sortKey="createdAt"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recipes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-text-muted">
                  Bu filtrelere uyan tarif bulunamadı.
                </td>
              </tr>
            ) : (
              recipes.map((r) => (
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
                  <td className="py-3 pr-4 text-text-muted">
                    {getDifficultyLabel(r.difficulty)}
                  </td>
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
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {r.viewCount.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {r._count.variations}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {r._count.bookmarks}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {r._count.reviews}
                  </td>
                  <td className="py-3 text-right text-xs tabular-nums text-text-muted">
                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        currentPage={page}
        totalItems={total}
        pageSize={PAGE_SIZE}
        buildHref={(p) => buildHref({ page: p === 1 ? null : p })}
      />
    </div>
  );
}
