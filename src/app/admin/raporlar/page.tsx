import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getReports,
  getFlaggedVariations,
  getReportedReviews,
} from "@/lib/queries/admin";
import { AdminReportActions } from "@/components/admin/AdminReportActions";
import { AdminVariationActions } from "@/components/admin/AdminVariationActions";
import { ReviewModerationActions } from "@/components/admin/ReviewModerationActions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pageTitles");
  return { title: t("reports") };
}

export default async function ReportsPage() {
  const [reports, flaggedVariations, reportedReviews, t, locale] = await Promise.all([
    getReports("PENDING"),
    getFlaggedVariations(),
    getReportedReviews(),
    getTranslations("admin.reports"),
    getLocale(),
  ]);

  return (
    <div className="space-y-10">
      {/* Raporlanmış Uyarlamalar */}
      <section>
        <h2 className="mb-4 font-heading text-xl font-bold">
          {t("variationsHeading", { count: flaggedVariations.length })}
        </h2>

        {flaggedVariations.length === 0 ? (
          <p className="text-sm text-text-muted">{t("emptyVariations")}</p>
        ) : (
          <div className="space-y-3">
            {flaggedVariations.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-border bg-bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-text">{v.miniTitle}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {v.recipe.emoji} {v.recipe.title}, @{v.author.username}
                    </p>
                    {v.description && (
                      <p className="mt-1 text-sm text-text-muted">{v.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error">
                      {t("reportCountChip", { count: v.reportCount })}
                    </span>
                    <span className="rounded-full bg-bg-elevated px-2.5 py-1 text-xs text-text-muted">
                      {v.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <AdminVariationActions variationId={v.id} currentStatus={v.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Raporlanmış Yorumlar */}
      <section>
        <h2 className="mb-4 font-heading text-xl font-bold">
          {t("reviewsHeading", { count: reportedReviews.length })}
        </h2>

        {reportedReviews.length === 0 ? (
          <p className="text-sm text-text-muted">{t("emptyReviews")}</p>
        ) : (
          <div className="space-y-3">
            {reportedReviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p
                      className="font-medium text-text"
                      aria-label={t("starAria", { rating: r.rating })}
                    >
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {r.recipe.emoji}{" "}
                      <Link
                        href={`/tarif/${r.recipe.slug}`}
                        className="text-primary hover:text-primary-hover"
                      >
                        {r.recipe.title}
                      </Link>{" "}
                     , @{r.user.username}
                    </p>
                    {r.comment && (
                      <blockquote className="mt-2 border-l-2 border-border pl-3 text-sm text-text">
                        {r.comment}
                      </blockquote>
                    )}
                  </div>
                  <span className="rounded-full bg-bg-elevated px-2.5 py-1 text-xs text-text-muted">
                    {r.status}
                  </span>
                </div>
                <div className="mt-3">
                  <ReviewModerationActions reviewId={r.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bekleyen Raporlar */}
      <section>
        <h2 className="mb-4 font-heading text-xl font-bold">
          {t("pendingHeading", { count: reports.length })}
        </h2>

        {reports.length === 0 ? (
          <p className="text-sm text-text-muted">{t("emptyPending")}</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-border bg-bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
                        {t.has(`reasons.${report.reason}`)
                          ? t(`reasons.${report.reason}`)
                          : report.reason}
                      </span>
                      <span className="rounded bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">
                        {t.has(`statuses.${report.status}`)
                          ? t(`statuses.${report.status}`)
                          : report.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      {report.targetType}: {report.targetId}
                    </p>
                    {report.description && (
                      <p className="mt-1 text-sm text-text">{report.description}</p>
                    )}
                    <p className="mt-1 text-xs text-text-muted">
                      {t("reportedByPrefix")} @{report.reporter.username},{" "}
                      {new Date(report.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <AdminReportActions reportId={report.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
