import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getAdminStats,
  getActiveNewsletterCount,
  getRecentRecipeAdditions,
  getRecentUserSignupCount,
  getMostReviewedRecipes,
  getMostSavedRecipes,
  getCuisineBreakdown,
} from "@/lib/queries/admin";
import { getTags } from "@/lib/queries/tag";
import { getTopSearchQueries } from "@/lib/queries/search-log";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.analytics");
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

/**
 * Admin analytics dashboard — `/admin/analytics`.
 *
 * Layout:
 *   1. 6 KPI cards (totals + last-7-day pace)
 *   2. 2 trend placeholder cards (view trend, search freq) — tracking
 *      altyapısı yok, grayed-out "coming soon" mesajı.
 *   3. 4 top-10 lists (cuisines, tags, most reviewed, most saved)
 *
 * Neden ayrı sayfa: `/admin` overview genel işletme sağlığını (moderasyon
 * kuyruğu + onboarding + rapor sayıları) gösteriyor; analytics sayfası ise
 * topluluk ilgisi (popülerlik + büyüme ivmesi) perspektifinden izlenir.
 * İki farklı soru, iki sayfa.
 */
export default async function AdminAnalyticsPage() {
  const [
    stats,
    newsletterCount,
    recipes7d,
    users7d,
    mostReviewed,
    mostSaved,
    cuisines,
    tags,
    topSearches,
    t,
  ] = await Promise.all([
    getAdminStats(),
    getActiveNewsletterCount(),
    getRecentRecipeAdditions(7),
    getRecentUserSignupCount(7),
    getMostReviewedRecipes(10),
    getMostSavedRecipes(10),
    getCuisineBreakdown(),
    getTags(),
    getTopSearchQueries(7, 10),
    getTranslations("admin.analytics"),
  ]);

  const topCuisines = cuisines.slice(0, 10);
  const topTags = tags.slice(0, 10);

  const kpis = [
    { label: t("metricTotalRecipes"), value: stats.totalRecipes, emoji: "📖" },
    { label: t("metricTotalUsers"), value: stats.totalUsers, emoji: "👥" },
    { label: t("metricTotalReviews"), value: stats.reviewCount, emoji: "⭐" },
    { label: t("metricNewsletterSubs"), value: newsletterCount, emoji: "📬" },
    {
      label: t("metricNewRecipes7d"),
      value: recipes7d,
      emoji: "🆕",
      highlight: recipes7d > 0,
    },
    {
      label: t("metricNewUsers7d"),
      value: users7d,
      emoji: "🌱",
      highlight: users7d > 0,
    },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h2 className="font-heading text-xl font-bold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      {/* KPI cards */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("metricsHeading")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-xl border bg-bg-card p-4 ${
                kpi.highlight
                  ? "border-primary/40 bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="mb-1 text-2xl" aria-hidden="true">
                {kpi.emoji}
              </div>
              <div className="font-heading text-2xl font-bold tabular-nums">
                {kpi.value.toLocaleString("tr-TR")}
              </div>
              <div className="mt-0.5 text-xs text-text-muted">{kpi.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trends */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("trendsHeading")}
        </h3>
        <div className="grid gap-3 lg:grid-cols-2">
          <TrendPlaceholder
            label={t("viewTrendLabel")}
            message={t("viewTrendNotTracked")}
          />
          <SearchFrequencyCard
            title={t("searchFreqLabel")}
            entries={topSearches}
            emptyMessage={t("searchFreqEmpty")}
            countSuffix={t("searchFreqCountSuffix")}
            windowLabel={t("searchFreqWindow")}
          />
        </div>
      </section>

      {/* Top 10 lists */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("topListsHeading")}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <CountList
            title={t("topCuisinesLabel")}
            items={topCuisines.map((c) => ({
              primary: `${c.flag ?? "🌍"} ${c.label}`,
              secondary: null,
              count: c.count,
              suffix: t("countSuffixRecipes"),
            }))}
            empty={t("emptyState")}
          />
          <CountList
            title={t("topTagsLabel")}
            items={topTags.map((tag) => ({
              primary: `#${tag.name}`,
              secondary: null,
              count: tag._count.recipeTags,
              suffix: t("countSuffixRecipes"),
              href: `/etiket/${tag.slug}`,
            }))}
            empty={t("emptyState")}
          />
          <CountList
            title={t("topReviewedLabel")}
            items={mostReviewed.map((r) => ({
              primary: `${r.emoji ?? "🍳"} ${r.title}`,
              secondary: null,
              count: r.reviewCount,
              suffix: t("countSuffixReviews"),
              href: `/tarif/${r.slug}`,
            }))}
            empty={t("emptyState")}
          />
          <CountList
            title={t("topSavedLabel")}
            items={mostSaved.map((r) => ({
              primary: `${r.emoji ?? "🍳"} ${r.title}`,
              secondary: null,
              count: r.saveCount,
              suffix: t("countSuffixSaves"),
              href: `/tarif/${r.slug}`,
            }))}
            empty={t("emptyState")}
          />
        </div>
      </section>
    </div>
  );
}

function TrendPlaceholder({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-bg-card/40 p-6">
      <div className="mb-2 text-sm font-semibold text-text-muted">{label}</div>
      <p className="text-xs leading-relaxed text-text-muted">{message}</p>
    </div>
  );
}

interface SearchFrequencyCardProps {
  title: string;
  entries: { query: string; count: number; avgResultCount: number }[];
  emptyMessage: string;
  countSuffix: string;
  windowLabel: string;
}

function SearchFrequencyCard({
  title,
  entries,
  emptyMessage,
  countSuffix,
  windowLabel,
}: SearchFrequencyCardProps) {
  const max = entries.reduce((m, e) => Math.max(m, e.count), 0) || 1;
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h4 className="font-heading text-base font-semibold">{title}</h4>
        <span className="text-xs text-text-muted">{windowLabel}</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-text-muted">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, idx) => {
            const widthPct = Math.max(8, Math.round((entry.count / max) * 100));
            return (
              <li key={`${entry.query}-${idx}`} className="flex items-center gap-3 text-sm">
                <span className="w-5 shrink-0 text-xs tabular-nums text-text-muted">
                  {idx + 1}.
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-text">
                  {entry.query}
                </span>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-bg-elevated"
                  style={{ width: 60 }}
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs tabular-nums text-text-muted">
                  {entry.count.toLocaleString("tr-TR")} {countSuffix}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface CountListItem {
  primary: string;
  secondary: string | null;
  count: number;
  suffix: string;
  href?: string;
}

function CountList({
  title,
  items,
  empty,
}: {
  title: string;
  items: CountListItem[];
  empty: string;
}) {
  const max = items.reduce((m, it) => Math.max(m, it.count), 0) || 1;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h4 className="mb-4 font-heading text-base font-semibold">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, idx) => {
            const widthPct = Math.max(8, Math.round((item.count / max) * 100));
            const label = (
              <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-text">
                <span className="w-5 shrink-0 text-xs tabular-nums text-text-muted">
                  {idx + 1}.
                </span>
                <span className="min-w-0 truncate">{item.primary}</span>
              </span>
            );
            return (
              <li key={`${item.primary}-${idx}`} className="flex items-center gap-3">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="min-w-0 flex-1 transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                ) : (
                  label
                )}
                <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-text-muted">
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-bg-elevated"
                    style={{ width: 60 }}
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-medium text-text">
                    {item.count.toLocaleString("tr-TR")}
                  </span>
                  <span className="hidden w-12 sm:inline">{item.suffix}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
