import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getAdminUsersList,
  type UserSortKey,
  type AdminUserListParams,
} from "@/lib/queries/admin";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { PaginationBar } from "@/components/admin/PaginationBar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pageTitles");
  return { title: t("users") };
}

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const ROLES = ["USER", "MODERATOR", "ADMIN"] as const;

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

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const sortRaw = firstStr(sp.sort, "createdAt");
  const sort: UserSortKey = (
    ["createdAt", "variations", "bookmarks", "reports", "reviews"].includes(sortRaw)
      ? sortRaw
      : "createdAt"
  ) as UserSortKey;
  const order: "asc" | "desc" = firstStr(sp.order, "desc") === "asc" ? "asc" : "desc";
  const role = firstStr(sp.role);
  const verifiedRaw = firstStr(sp.verified);
  const verified: "yes" | "no" | undefined =
    verifiedRaw === "yes" ? "yes" : verifiedRaw === "no" ? "no" : undefined;
  const search = firstStr(sp.q);
  const page = Math.max(1, parseInt(firstStr(sp.page, "1"), 10) || 1);

  const params: AdminUserListParams = {
    sort,
    order,
    role: role || undefined,
    verified,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const [{ users, total }, t, tActions, tDashboard, locale] = await Promise.all([
    getAdminUsersList(params),
    getTranslations("admin.users"),
    getTranslations("admin.actions"),
    getTranslations("admin.dashboard"),
    getLocale(),
  ]);

  function buildHref(overrides: Record<string, string | number | null>) {
    const out = new URLSearchParams();
    if (sort !== "createdAt") out.set("sort", sort);
    if (order !== "desc") out.set("order", order);
    if (role) out.set("role", role);
    if (verified) out.set("verified", verified);
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
    return qs ? `/admin/kullanicilar?${qs}` : "/admin/kullanicilar";
  }

  function sortHref(nextSort: UserSortKey, nextOrder: "asc" | "desc") {
    return buildHref({
      sort: nextSort === "createdAt" ? null : nextSort,
      order: nextOrder === "desc" ? null : nextOrder,
      page: null,
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          {t("headingWithCount", { count: total.toLocaleString(locale) })}
        </h2>
        <a
          href="/api/admin/export/users"
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-elevated"
        >
          📥 {tDashboard("csvUsers")}
        </a>
      </div>

      {/* Filters */}
      <form
        method="get"
        action="/admin/kullanicilar"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <input
          name="q"
          defaultValue={search}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-w-[220px] rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <select
          name="role"
          defaultValue={role}
          aria-label={t("colRole")}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t("roleAll")}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          name="verified"
          defaultValue={verified ?? ""}
          aria-label={t("colVerified")}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t("verifiedAll")}</option>
          <option value="yes">{t("verifiedYes")}</option>
          <option value="no">{t("verifiedNo")}</option>
        </select>
        {sort !== "createdAt" && <input type="hidden" name="sort" value={sort} />}
        {order !== "desc" && <input type="hidden" name="order" value={order} />}
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {tActions("apply")}
        </button>
        {(search || role || verified) && (
          <Link
            href="/admin/kullanicilar"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-bg-elevated"
          >
            {tActions("clear")}
          </Link>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("colName")}
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("colEmail")}
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("colRole")}
              </th>
              <SortableHeader<UserSortKey>
                label={tDashboard("variationTitle")}
                sortKey="variations"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<UserSortKey>
                label={tDashboard("reviewTitle")}
                sortKey="reviews"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<UserSortKey>
                label={tDashboard("bookmarkTitle")}
                sortKey="bookmarks"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<UserSortKey>
                label={tDashboard("statPendingReports")}
                sortKey="reports"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<UserSortKey>
                label={t("colCreated")}
                sortKey="createdAt"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-text-muted">
                  {t("emptyFiltered")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-bg-card">
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-text">
                        {u.username ? (
                          <Link
                            href={`/admin/kullanicilar/${u.username}`}
                            className="hover:text-primary"
                          >
                            {u.name || u.username}
                          </Link>
                        ) : (
                          u.name || tDashboard("anonymousUser")
                        )}
                        {u.isVerified && (
                          <span
                            className="ml-1 text-xs text-accent-blue"
                            title="Tarifle ekibi"
                          >
                            ✓
                          </span>
                        )}
                        {u.emailVerified && (
                          <span
                            className="ml-1 text-xs text-accent-green"
                            title="E-posta doğrulanmış"
                          >
                            ✉
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">
                        {u.username ? (
                          <Link
                            href={`/admin/kullanicilar/${u.username}`}
                            className="hover:text-primary"
                          >
                            @{u.username}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-text-muted">{u.email ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-primary/10 text-primary"
                          : u.role === "MODERATOR"
                            ? "bg-accent-blue/10 text-accent-blue"
                            : "bg-bg-elevated text-text-muted"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {u._count.variations}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {u._count.reviews}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {u._count.bookmarks}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-text-muted">
                    {u._count.reports}
                  </td>
                  <td className="py-3 text-right text-xs tabular-nums text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString(locale)}
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
