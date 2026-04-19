import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  REVIEW_BROWSE_PAGE_SIZE,
  getReviewsForBrowse,
  resolveRange,
  type ReviewBrowseRange,
} from "@/lib/queries/admin-reviews-browse";
import { Pagination } from "@/components/listing/Pagination";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.reviewsBrowse");
  return { title: t("heading"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

interface YorumlarPageProps {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

/** Map the resolved range back onto the `preset` key used in the URL so
 *  the chip UI can highlight the active preset. "custom" is active when
 *  the caller passed valid from/to. */
function rangeToActivePreset(range: ReviewBrowseRange): string {
  if (range.kind === "custom") return "custom";
  return range.kind;
}

/** Number formatter helpers — locale-aware date rendering for review
 *  timestamps. "tr" → "19 Nis 2026 05:33", "en" → "Apr 19, 2026, 5:33 AM". */
function formatDateTime(d: Date, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(d);
}

export default async function YorumlarPage({ searchParams }: YorumlarPageProps) {
  const sp = await searchParams;
  const range = resolveRange({
    preset: sp.preset ?? null,
    from: sp.from ?? null,
    to: sp.to ?? null,
  });
  const activePreset = rangeToActivePreset(range);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ rows, total }, t, tCommon, locale] = await Promise.all([
    getReviewsForBrowse({ range, page }),
    getTranslations("admin.reviewsBrowse"),
    getTranslations("recipes"),
    getLocale(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / REVIEW_BROWSE_PAGE_SIZE));

  const presets = [
    { key: "last7", label: t("presetLast7") },
    { key: "last30", label: t("presetLast30") },
    { key: "thisMonth", label: t("presetThisMonth") },
    { key: "all", label: t("presetAll") },
  ] as const;

  /** Build a URL preserving `from/to` only for the custom preset; for
   *  named presets we strip those so the URL stays clean. Always strip
   *  `page` so switching ranges resets to page 1. */
  function presetUrl(key: string): string {
    const p = new URLSearchParams();
    if (key !== "last7") p.set("preset", key);
    return `/admin/yorumlar${p.toString() ? `?${p.toString()}` : ""}`;
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-heading text-xl font-semibold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      {/* Preset chips — tek tıkla yaygın aralıklara geç, yük kontrolü.
          Custom range input'u ayrı form ile aşağıda; URL'i direkt yazmak
          isteyen admin ?preset=custom&from=YYYY-MM-DD&to=... de koşturabilir. */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {presets.map(({ key, label }) => {
            const isActive = activePreset === key;
            return (
              <Link
                key={key}
                href={presetUrl(key)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-3 py-1 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-bg-card text-text-muted hover:bg-bg-elevated hover:text-text"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Custom range form — GET submit, native date input'lar. Admin
            istediği günü seçer, "Uygula" bağlantısı URL'i set eder. */}
        <form
          method="GET"
          action="/admin/yorumlar"
          className="flex flex-wrap items-end gap-3 text-xs"
        >
          <input type="hidden" name="preset" value="custom" />
          <label className="flex flex-col gap-1">
            <span className="text-text-muted">{t("customFromLabel")}</span>
            <input
              type="date"
              name="from"
              defaultValue={
                range.kind === "custom"
                  ? range.from.toISOString().slice(0, 10)
                  : ""
              }
              className="rounded border border-border bg-bg-card px-2 py-1 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-text-muted">{t("customToLabel")}</span>
            <input
              type="date"
              name="to"
              defaultValue={
                range.kind === "custom"
                  ? range.to.toISOString().slice(0, 10)
                  : ""
              }
              className="rounded border border-border bg-bg-card px-2 py-1 text-xs"
            />
          </label>
          <button
            type="submit"
            className="rounded border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
          >
            {t("applyCustom")}
          </button>
        </form>

        {range.kind === "all" && (
          <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
            ⚠ {t("allWarning")}
          </p>
        )}

        <p className="text-xs text-text-muted">
          {t("totalFound", { count: total })}
        </p>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-text-muted">{t("empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            // Star emoji as a reading aid; real star glyphs + sr aria
            // keep screen readers happy. Status chip colors echo the
            // existing review queue design system (primary/ green / error).
            const statusColor =
              r.status === "PUBLISHED"
                ? "bg-accent-green/10 text-accent-green"
                : r.status === "PENDING_REVIEW"
                  ? "bg-primary/10 text-primary"
                  : "bg-error/10 text-error";
            return (
              <li
                key={r.id}
                className="rounded-xl border border-border bg-bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span
                        className="text-sm font-semibold tabular-nums text-primary"
                        aria-label={t("ratingAria", { rating: r.rating })}
                      >
                        {"★".repeat(r.rating)}
                        <span className="text-text-muted/50">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor}`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-text-muted tabular-nums">
                        {formatDateTime(r.createdAt, locale)}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted">
                      <Link
                        href={`/admin/kullanicilar/${r.user.username ?? r.user.id}`}
                        className="font-medium text-text hover:text-primary"
                      >
                        {t("byAuthor", { username: r.user.username ?? "—" })}
                      </Link>
                      <span className="mx-1.5">·</span>
                      <span>{t("onRecipe")}</span>{" "}
                      <Link
                        href={`/tarif/${r.recipe.slug}`}
                        className="text-primary hover:underline"
                      >
                        {r.recipe.emoji} {r.recipe.title}
                      </Link>
                    </p>

                    {r.comment ? (
                      <p className="whitespace-pre-wrap break-words text-sm text-text">
                        {r.comment}
                      </p>
                    ) : (
                      <p className="text-xs italic text-text-muted">
                        {t("noComment")}
                      </p>
                    )}

                    {r.hiddenReason && (
                      <p className="mt-1 text-xs text-error">
                        {t("hiddenReason")} {r.hiddenReason}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <Pagination
          basePath="/admin/yorumlar"
          currentPage={page}
          totalPages={totalPages}
          searchParams={sp}
          t={tCommon}
          totalItems={total}
          pageSize={REVIEW_BROWSE_PAGE_SIZE}
        />
      )}
    </div>
  );
}
