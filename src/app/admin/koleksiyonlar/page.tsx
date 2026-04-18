import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getAdminCollections,
  type AdminCollectionParams,
} from "@/lib/queries/admin";
import { PaginationBar } from "@/components/admin/PaginationBar";
import { CollectionActions } from "@/components/admin/CollectionActions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pageTitles");
  return { title: t("collections"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

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

export default async function AdminCollectionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const visibilityRaw = firstStr(sp.visibility);
  const visibility: AdminCollectionParams["visibility"] =
    visibilityRaw === "public" || visibilityRaw === "private" || visibilityRaw === "hidden"
      ? visibilityRaw
      : undefined;
  const search = firstStr(sp.q);
  const page = Math.max(1, parseInt(firstStr(sp.page, "1"), 10) || 1);

  const [{ collections, total }, t, tActions, locale] = await Promise.all([
    getAdminCollections({
      visibility,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    getTranslations("admin.collections"),
    getTranslations("admin.actions"),
    getLocale(),
  ]);

  function buildHref(overrides: Record<string, string | number | null>) {
    const out = new URLSearchParams();
    if (visibility) out.set("visibility", visibility);
    if (search) out.set("q", search);
    if (page > 1) out.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "" || v === 0) out.delete(k);
      else out.set(k, String(v));
    }
    const qs = out.toString();
    return qs ? `/admin/koleksiyonlar?${qs}` : "/admin/koleksiyonlar";
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          {t("headingWithCount", { count: total.toLocaleString(locale) })}
        </h2>
      </div>

      <form
        method="get"
        action="/admin/koleksiyonlar"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <input
          name="q"
          defaultValue={search}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          className="min-w-[200px] rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <select
          name="visibility"
          defaultValue={visibility ?? ""}
          aria-label={t("visibilityAria")}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t("visibilityAll")}</option>
          <option value="public">{t("visibilityPublic")}</option>
          <option value="private">{t("visibilityPrivate")}</option>
          <option value="hidden">{t("visibilityHidden")}</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {tActions("apply")}
        </button>
        {(visibility || search) && (
          <Link
            href="/admin/koleksiyonlar"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-bg-elevated"
          >
            {tActions("clear")}
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        {collections.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            {t("emptyFiltered")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {collections.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-lg"
                >
                  {c.emoji ?? "📁"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/koleksiyon/${c.id}`}
                      target="_blank"
                      rel="noopener"
                      className="truncate font-medium text-text hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    {c.isPublic ? (
                      <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-medium text-accent-green">
                        {t("publicBadge")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
                        {t("privateBadge")}
                      </span>
                    )}
                    {c.hiddenAt && (
                      <span
                        className="rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-medium text-error"
                        title={c.hiddenReason ?? ""}
                      >
                        {t("hiddenBadge")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {c.user.username ? (
                      <Link
                        href={`/admin/kullanicilar/${c.user.username}`}
                        className="hover:text-primary"
                      >
                        {c.user.name ?? `@${c.user.username}`}
                      </Link>
                    ) : (
                      t("deletedUser")
                    )}
                    {" · "}
                    {t("itemsCount", { count: c._count.items })} ·{" "}
                    {new Date(c.createdAt).toLocaleDateString(locale)}
                  </p>
                  {c.hiddenAt && c.hiddenReason && (
                    <p className="mt-1 text-[11px] italic text-text-muted">
                      {t("hiddenReasonPrefix", { reason: c.hiddenReason })}
                    </p>
                  )}
                </div>
                {c.isPublic && (
                  <CollectionActions
                    collectionId={c.id}
                    hidden={!!c.hiddenAt}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
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
