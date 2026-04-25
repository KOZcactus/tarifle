import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getAdminRecipesList,
  type RecipeSortKey,
  type AdminRecipeListParams,
} from "@/lib/queries/admin";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { PaginationBar } from "@/components/admin/PaginationBar";
import { prisma } from "@/lib/prisma";
import { CUISINE_CODES, CUISINE_FLAG } from "@/lib/cuisines";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pageTitles");
  return { title: t("recipes") };
}

export const dynamic = "force-dynamic";

const DIFFICULTY_KEY = {
  EASY: "difficultyEasy",
  MEDIUM: "difficultyMedium",
  HARD: "difficultyHard",
} as const;

const PAGE_SIZE = 50;

const STATUSES = ["PUBLISHED", "DRAFT", "PENDING_REVIEW", "HIDDEN", "REJECTED"] as const;

const RECIPE_TYPES = [
  "YEMEK",
  "CORBA",
  "TATLI",
  "KAHVALTI",
  "SALATA",
  "APERATIF",
  "ATISTIRMALIK",
  "ICECEK",
  "KOKTEYL",
  "SOS",
] as const;

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
  const cuisine = firstStr(sp.cuisine);
  const categorySlug = firstStr(sp.category);
  const recipeType = firstStr(sp.type);
  const featuredRaw = firstStr(sp.featured);
  const featured: boolean | undefined =
    featuredRaw === "1" ? true : featuredRaw === "0" ? false : undefined;
  const page = Math.max(1, parseInt(firstStr(sp.page, "1"), 10) || 1);

  const params: AdminRecipeListParams = {
    sort,
    order,
    status: status || undefined,
    search: search || undefined,
    cuisine: cuisine || undefined,
    categorySlug: categorySlug || undefined,
    type: recipeType || undefined,
    featured,
    page,
    pageSize: PAGE_SIZE,
  };

  const [{ recipes, total }, allCategories, t, tActions, tDashboard, tCard, locale] =
    await Promise.all([
      getAdminRecipesList(params),
      prisma.category.findMany({
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      }),
      getTranslations("admin.recipes"),
      getTranslations("admin.actions"),
      getTranslations("admin.dashboard"),
      getTranslations("recipes.card"),
      getLocale(),
    ]);

  const hasAnyFilter = !!(
    search ||
    status ||
    cuisine ||
    categorySlug ||
    recipeType ||
    featured !== undefined
  );

  // Helper, preserve other search params when building next URL
  function buildHref(overrides: Record<string, string | number | null>) {
    const out = new URLSearchParams();
    if (sort !== "createdAt") out.set("sort", sort);
    if (order !== "desc") out.set("order", order);
    if (status) out.set("status", status);
    if (search) out.set("q", search);
    if (cuisine) out.set("cuisine", cuisine);
    if (categorySlug) out.set("category", categorySlug);
    if (recipeType) out.set("type", recipeType);
    if (featured === true) out.set("featured", "1");
    if (featured === false) out.set("featured", "0");
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
          {t("headingWithCount", { count: total.toLocaleString(locale) })}
        </h2>
        <a
          href="/api/admin/export/recipes"
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-elevated"
        >
          📥 {tDashboard("csvRecipes")}
        </a>
      </div>

      {/* Filters - oturum 21 genisletme: cuisine + category + type +
          isFeatured chip filter eklendi (3700+ tarif yorgunlugu icin) */}
      <form
        method="get"
        action="/admin/tarifler"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <input
          name="q"
          defaultValue={search}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-w-[180px] rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label={t("colStatus")}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t("statusAll")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="cuisine"
          defaultValue={cuisine}
          aria-label="Mutfak"
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm mutfaklar</option>
          {CUISINE_CODES.map((c) => (
            <option key={c} value={c}>
              {CUISINE_FLAG[c]} {c}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={categorySlug}
          aria-label="Kategori"
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm kategoriler</option>
          {allCategories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={recipeType}
          aria-label="Tip"
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm tipler</option>
          {RECIPE_TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {tp}
            </option>
          ))}
        </select>
        <select
          name="featured"
          defaultValue={featuredRaw}
          aria-label="Öne çıkan"
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tümü</option>
          <option value="1">⭐ Öne çıkan</option>
          <option value="0">Sade</option>
        </select>
        {/* Preserve sort on submit */}
        {sort !== "createdAt" && <input type="hidden" name="sort" value={sort} />}
        {order !== "desc" && <input type="hidden" name="order" value={order} />}
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {tActions("apply")}
        </button>
        {hasAnyFilter && (
          <Link
            href="/admin/tarifler"
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
                {t("colTitle")}
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("colCategory")}
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("colDifficulty")}
              </th>
              <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted">
                {t("colStatus")}
              </th>
              <SortableHeader<RecipeSortKey>
                label={t("colViews")}
                sortKey="viewCount"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<RecipeSortKey>
                label={tDashboard("variationTitle")}
                sortKey="variations"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <SortableHeader<RecipeSortKey>
                label={tDashboard("bookmarkTitle")}
                sortKey="bookmarks"
                currentSort={sort}
                currentOrder={order}
                buildHref={sortHref}
                align="right"
              />
              <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                {tDashboard("reviewTitle")}
              </th>
              <SortableHeader<RecipeSortKey>
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
            {recipes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-text-muted">
                  {t("emptyFiltered")}
                </td>
              </tr>
            ) : (
              recipes.map((r) => (
                <tr key={r.id} className="hover:bg-bg-card">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/tarifler/${r.slug}`}
                        className="font-medium text-text hover:text-primary"
                      >
                        {r.emoji} {r.title}
                        {r.isFeatured && (
                          <span className="ml-1 text-xs text-secondary">★</span>
                        )}
                      </Link>
                      <Link
                        href={`/tarif/${r.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-text-muted hover:text-primary"
                        title={t("viewPublic")}
                        aria-label={t("viewPublic")}
                      >
                        ↗
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-text-muted">{r.category.name}</td>
                  <td className="py-3 pr-4 text-text-muted">
                    {tCard(DIFFICULTY_KEY[r.difficulty])}
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
                    {r.viewCount.toLocaleString(locale)}
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
                    {new Date(r.createdAt).toLocaleDateString(locale)}
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
