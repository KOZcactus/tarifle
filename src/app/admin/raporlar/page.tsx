import Link from "next/link";
import {
  getReports,
  getFlaggedVariations,
  getReportedReviews,
} from "@/lib/queries/admin";
import { AdminReportActions } from "@/components/admin/AdminReportActions";
import { AdminVariationActions } from "@/components/admin/AdminVariationActions";
import { ReviewModerationActions } from "@/components/admin/ReviewModerationActions";

export const metadata = { title: "Raporlar | Yönetim Paneli" };

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam / Reklam",
  PROFANITY: "Uygunsuz dil",
  MISLEADING: "Yanıltıcı bilgi",
  HARMFUL: "Zararlı içerik",
  OTHER: "Diğer",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  REVIEWED: "İncelendi",
  DISMISSED: "Reddedildi",
};

export default async function ReportsPage() {
  const [reports, flaggedVariations, reportedReviews] = await Promise.all([
    getReports("PENDING"),
    getFlaggedVariations(),
    getReportedReviews(),
  ]);

  return (
    <div className="space-y-10">
      {/* Raporlanmış Uyarlamalar */}
      <section>
        <h2 className="mb-4 font-heading text-xl font-bold">
          Raporlanmış Uyarlamalar ({flaggedVariations.length})
        </h2>

        {flaggedVariations.length === 0 ? (
          <p className="text-sm text-text-muted">Raporlanmış uyarlama yok.</p>
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
                      {v.recipe.emoji} {v.recipe.title} — @{v.author.username}
                    </p>
                    {v.description && (
                      <p className="mt-1 text-sm text-text-muted">{v.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error">
                      {v.reportCount} rapor
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
          Raporlanmış Yorumlar ({reportedReviews.length})
        </h2>

        {reportedReviews.length === 0 ? (
          <p className="text-sm text-text-muted">Raporlanmış yorum yok.</p>
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
                      aria-label={`${r.rating} yıldız`}
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
                      — @{r.user.username}
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
          Bekleyen Raporlar ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <p className="text-sm text-text-muted">Bekleyen rapor yok.</p>
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
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                      <span className="rounded bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">
                        {STATUS_LABELS[report.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      {report.targetType}: {report.targetId}
                    </p>
                    {report.description && (
                      <p className="mt-1 text-sm text-text">{report.description}</p>
                    )}
                    <p className="mt-1 text-xs text-text-muted">
                      Raporlayan: @{report.reporter.username} — {new Date(report.createdAt).toLocaleDateString("tr-TR")}
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
