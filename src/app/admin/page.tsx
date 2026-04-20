import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  getAdminStats,
  getRecentBatches,
  getCategoryBreakdown,
  getCuisineBreakdown,
  getTopViewedRecipes,
  getRecentSignups,
  getUserGrowthDaily,
  getReviewDistribution,
  getMostActiveUsers,
  getMostReportedVariations,
  getMostReportedReviews,
} from "@/lib/queries/admin";

export const metadata = { title: "Yönetim Paneli | Tarifle" };

export default async function AdminPage() {
  const [
    stats,
    batches,
    categories,
    cuisines,
    topViewed,
    recentSignups,
    userGrowth,
    reviewDist,
    activeUsers,
    reportedVariations,
    reportedReviews,
    t,
  ] = await Promise.all([
    getAdminStats(),
    getRecentBatches(7),
    getCategoryBreakdown(),
    getCuisineBreakdown(),
    getTopViewedRecipes(5),
    getRecentSignups(10),
    getUserGrowthDaily(30),
    getReviewDistribution(),
    getMostActiveUsers(10),
    getMostReportedVariations(5),
    getMostReportedReviews(5),
    getTranslations("admin.dashboard"),
  ]);

  // Üst sıra, yüksek-frekans bilgi (toplamlar + moderasyon).
  const topCards = [
    { label: t("statTotalRecipes"), value: stats.totalRecipes, emoji: "📖" },
    { label: t("statTotalUsers"), value: stats.totalUsers, emoji: "👥" },
    { label: t("statTotalVariations"), value: stats.totalVariations, emoji: "🔄" },
    {
      label:
        stats.reviewAverage !== null
          ? t("statReviewsWithAvg", { avg: stats.reviewAverage })
          : t("statReviews"),
      value: stats.reviewCount,
      emoji: "⭐",
    },
    { label: t("statBookmarks"), value: stats.totalBookmarks, emoji: "🔖" },
    { label: t("statCollections"), value: stats.totalCollections, emoji: "📚" },
    {
      // Unified: variation PENDING + review PENDING
      label: t("statReviewQueue", {
        variations: stats.pendingVariations,
        reviews: stats.pendingReviewsQueue,
      }),
      value: stats.pendingQueueTotal,
      emoji: "🧐",
      highlight: stats.pendingQueueTotal > 0,
    },
    {
      label: t("statPendingReports"),
      value: stats.pendingReports,
      emoji: "🚩",
      highlight: stats.pendingReports > 0,
    },
    {
      label: t("statFlaggedVariations"),
      value: stats.flaggedVariations,
      emoji: "⚠️",
      highlight: stats.flaggedVariations > 0,
    },
    {
      label: t("statEmailVerified", { ratio: stats.emailVerifiedRatio }),
      value: stats.emailVerifiedCount,
      emoji: "✉️",
      highlight: stats.emailVerifiedRatio < 60,
    },
    {
      label: t("statNutrition", { ratio: stats.nutritionCoverage }),
      value: stats.nutritionCount,
      emoji: "🥗",
      highlight: stats.nutritionCoverage < 50,
    },
    {
      label: t("statFeatured", { ratio: stats.featuredRatio }),
      value: stats.featuredCount,
      emoji: "✨",
      highlight: stats.featuredRatio < 10 || stats.featuredRatio > 15,
    },
    {
      label: t("statImageless", { ratio: stats.imagelessRatio }),
      value: stats.imagelessCount,
      emoji: "📷",
      // Bugün 1100/1100 imageUrl null → %100. Alarm çalsın ki Kerem unutmasın.
      highlight: stats.imagelessRatio > 20,
    },
  ];

  // User growth için max değer, bar chart normalize eder.
  const maxGrowth = Math.max(...userGrowth.map((d) => d.count), 1);
  const totalReviews = Object.values(reviewDist).reduce((a, b) => a + b, 0);
  const totalGrowth = userGrowth.reduce((a, b) => a + b.count, 0);

  // İkinci sıra, kataloğun büyüme hızı.
  const activityCards = [
    { label: t("activityToday"), value: stats.recipesToday, emoji: "🌅" },
    { label: t("activityThisWeek"), value: stats.recipesThisWeek, emoji: "📅" },
    { label: t("activityThisMonth"), value: stats.recipesThisMonth, emoji: "📆" },
  ];

  // Mini bar chart için max değer, sütun yüksekliklerini normalize eder.
  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">{t("overviewHeading")}</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">{t("csvLabel")}</span>
            <a
              href="/api/admin/export/recipes"
              download
              className="rounded border border-border px-2 py-1 hover:bg-bg-elevated"
            >
              {t("csvRecipes")}
            </a>
            <a
              href="/api/admin/export/users"
              download
              className="rounded border border-border px-2 py-1 hover:bg-bg-elevated"
            >
              {t("csvUsers")}
            </a>
            <a
              href="/api/admin/export/reviews"
              download
              className="rounded border border-border px-2 py-1 hover:bg-bg-elevated"
            >
              {t("csvReviews")}
            </a>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border p-5 ${
                card.highlight
                  ? "border-error/30 bg-error/5"
                  : "border-border bg-bg-card"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {card.emoji}
                </span>
                <div>
                  <p className="text-2xl font-bold text-text">
                    {card.value.toLocaleString("tr-TR")}
                  </p>
                  <p className="text-xs text-text-muted">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("activityHeading")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {activityCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {card.emoji}
                </span>
                <div>
                  <p className="text-xl font-bold text-text">
                    {card.value.toLocaleString("tr-TR")}
                  </p>
                  <p className="text-[11px] text-text-muted">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User growth, son 30 gün */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("growthHeading")}
        </h3>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div
            className="flex h-24 items-end gap-0.5"
            role="img"
            aria-label={t("growthAria", { total: totalGrowth })}
          >
            {userGrowth.map((d) => {
              const height = maxGrowth > 0 ? (d.count / maxGrowth) * 100 : 0;
              return (
                <div
                  key={d.day}
                  title={t("growthDayTitle", { day: d.day, count: d.count })}
                  className="flex-1 rounded-t-sm bg-accent-blue/70 transition-opacity hover:opacity-100"
                  style={{
                    height: `${Math.max(height, d.count > 0 ? 4 : 1)}%`,
                    opacity: d.count > 0 ? 1 : 0.3,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-text-muted">
            <span>{userGrowth[0]?.day}</span>
            <span className="font-medium">
              {t("growthTotal", { count: totalGrowth })}
            </span>
            <span>{userGrowth[userGrowth.length - 1]?.day}</span>
          </div>
        </div>
      </section>

      {/* Review dağılımı, 5 yıldız dağılımı */}
      {totalReviews > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold">
            {t("reviewDistHeading")}
          </h3>
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <ul className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = reviewDist[n as 1 | 2 | 3 | 4 | 5];
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <li
                    key={n}
                    className="grid grid-cols-[60px_1fr_60px] items-center gap-3 text-sm"
                  >
                    <span className="text-[#f5a623]">
                      {"★".repeat(n)}
                      <span className="text-text-muted">
                        {"★".repeat(5 - n)}
                      </span>
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className="h-full bg-[#f5a623] transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right font-medium">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Top viewed tarifler */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("topViewedHeading")}
        </h3>
        <div className="rounded-xl border border-border bg-bg-card">
          {topViewed.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">{t("topViewedEmpty")}</p>
          ) : (
            <ol className="divide-y divide-border">
              {topViewed.map((r, i) => (
                <li
                  key={r.slug}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="w-6 text-center font-mono text-xs text-text-muted">
                    #{i + 1}
                  </span>
                  <span aria-hidden="true" className="text-lg">
                    {r.emoji ?? "•"}
                  </span>
                  <Link
                    href={`/tarif/${r.slug}`}
                    className="flex-1 truncate text-text hover:text-primary"
                  >
                    {r.title}
                  </Link>
                  {r.isFeatured && (
                    <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-medium text-secondary">
                      {t("featuredBadge")}
                    </span>
                  )}
                  <span className="tabular-nums text-text-muted">
                    👁 {r.viewCount.toLocaleString("tr-TR")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* En aktif kullanıcılar */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("activeUsersHeading")}
        </h3>
        <div className="rounded-xl border border-border bg-bg-card">
          {activeUsers.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">
              {t("activeUsersEmpty")}
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {activeUsers.map((u, i) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="w-6 text-center font-mono text-xs text-text-muted">
                    #{i + 1}
                  </span>
                  <Link
                    href={`/profil/${u.username ?? ""}`}
                    className="flex-1 truncate text-text hover:text-primary"
                  >
                    {u.name ?? u.username ?? t("anonymousUser")}
                    <span className="ml-2 text-xs text-text-muted">
                      @{u.username ?? "—"}
                    </span>
                    {u.role !== "USER" && (
                      <span className="ml-2 rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-blue">
                        {u.role}
                      </span>
                    )}
                  </Link>
                  <div className="flex shrink-0 gap-3 text-xs text-text-muted tabular-nums">
                    <span title={t("variationTitle")}>🔄 {u.variationCount}</span>
                    <span title={t("reviewTitle")}>⭐ {u.reviewCount}</span>
                    <span title={t("bookmarkTitle")}>🔖 {u.bookmarkCount}</span>
                    <span
                      className="w-10 text-right font-semibold text-text"
                      title={t("scoreTitle")}
                    >
                      {u.score}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* En çok raporlanan içerik */}
      {(reportedVariations.length > 0 || reportedReviews.length > 0) && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold">
            {t("reportedHeading")}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg-card">
              <h4 className="border-b border-border bg-bg-elevated/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {t("reportedVariationsHeading", { count: reportedVariations.length })}
              </h4>
              {reportedVariations.length === 0 ? (
                <p className="p-4 text-sm text-text-muted">{t("reportedClean")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {reportedVariations.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/tarif/${v.recipe.slug}`}
                          className="block truncate font-medium text-text hover:text-primary"
                        >
                          {v.miniTitle}
                        </Link>
                        <p className="truncate text-xs text-text-muted">
                          {v.recipe.title}, @{v.author.username ?? "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {v.status !== "PUBLISHED" && (
                          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
                            {v.status}
                          </span>
                        )}
                        <span className="rounded-full bg-error/15 px-2 py-0.5 text-xs font-semibold text-error">
                          {t("reportedCount", { count: v.reportCount })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border bg-bg-card">
              <h4 className="border-b border-border bg-bg-elevated/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {t("reportedReviewsHeading", { count: reportedReviews.length })}
              </h4>
              {reportedReviews.length === 0 ? (
                <p className="p-4 text-sm text-text-muted">{t("reportedClean")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {reportedReviews.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/tarif/${r.recipe.slug}`}
                          className="block truncate font-medium text-text hover:text-primary"
                        >
                          {r.recipe.title}
                        </Link>
                        <p className="truncate text-xs text-text-muted">
                          {"★".repeat(r.rating)}, @{r.user.username ?? "—"}
                          {r.comment && ` · "${r.comment.slice(0, 40)}${r.comment.length > 40 ? "…" : ""}"`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {r.status !== "PUBLISHED" && (
                          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
                            {r.status}
                          </span>
                        )}
                        <span className="rounded-full bg-error/15 px-2 py-0.5 text-xs font-semibold text-error">
                          {t("reportedCount", { count: r.reportCount })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Son kayıtlar */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("recentSignupsHeading")}
        </h3>
        <div className="rounded-xl border border-border bg-bg-card">
          {recentSignups.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">{t("recentSignupsEmpty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentSignups.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                    {(u.name ?? u.username ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-text">
                      {u.name ?? u.username ?? t("anonymousUser")}
                      {u.role !== "USER" && (
                        <span className="ml-2 rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-blue">
                          {u.role}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      @{u.username ?? "—"}
                      {u.email && <span className="ml-2">· {u.email}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-text-muted">
                    <div>{new Date(u.createdAt).toLocaleDateString("tr-TR")}</div>
                    <div>
                      {u.emailVerified ? (
                        <span className="text-accent-green">{t("verifiedLabel")}</span>
                      ) : (
                        <span>{t("pendingVerifyLabel")}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("batchesHeading")}
        </h3>
        {batches.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("batchesEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated/40 text-left">
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                    {t("batchDateHeader")}
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                    {t("batchCountHeader")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, i) => (
                  <tr
                    key={b.hour.toISOString()}
                    className={
                      i < batches.length - 1 ? "border-b border-border" : ""
                    }
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {b.hour.toISOString().replace("T", " ").substring(0, 16)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {b.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-[11px] text-text-muted">
          {t("batchesFooter")}
        </p>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("categoriesHeading")}
        </h3>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c.name}
                className="grid grid-cols-[150px_1fr_50px] items-center gap-3"
              >
                <span className="flex items-center gap-1.5 text-sm">
                  <span aria-hidden="true">{c.emoji ?? "•"}</span>
                  <span>{c.name}</span>
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(c.count / maxCategoryCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-right text-sm font-medium text-text">
                  {c.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cuisine breakdown */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          {t("cuisinesHeading")}
        </h3>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <ul className="space-y-2">
            {cuisines.map((c) => {
              const maxCuisine = Math.max(...cuisines.map((x) => x.count), 1);
              return (
                <li
                  key={c.code}
                  className="grid grid-cols-[140px_1fr_50px] items-center gap-3"
                >
                  <span className="flex items-center gap-1.5 text-sm">
                    <span aria-hidden="true">{c.flag}</span>
                    <span>{c.label}</span>
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className="h-full rounded-full bg-accent-blue"
                      style={{
                        width: `${(c.count / maxCuisine) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-right text-sm font-medium text-text">
                    {c.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
