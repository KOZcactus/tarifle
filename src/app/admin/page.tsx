import {
  getAdminStats,
  getRecentBatches,
  getCategoryBreakdown,
} from "@/lib/queries/admin";

export const metadata = { title: "Yönetim Paneli | Tarifle" };

export default async function AdminPage() {
  const [stats, batches, categories] = await Promise.all([
    getAdminStats(),
    getRecentBatches(7),
    getCategoryBreakdown(),
  ]);

  // Üst sıra — yüksek-frekans bilgi (toplamlar + moderasyon).
  const topCards = [
    { label: "Toplam Tarif", value: stats.totalRecipes, emoji: "📖" },
    { label: "Toplam Kullanıcı", value: stats.totalUsers, emoji: "👥" },
    { label: "Toplam Uyarlama", value: stats.totalVariations, emoji: "🔄" },
    { label: "Bookmark", value: stats.totalBookmarks, emoji: "🔖" },
    { label: "Koleksiyon", value: stats.totalCollections, emoji: "📚" },
    {
      label: "İnceleme Bekliyor",
      value: stats.pendingReviews,
      emoji: "🧐",
      highlight: stats.pendingReviews > 0,
    },
    {
      label: "Bekleyen Rapor",
      value: stats.pendingReports,
      emoji: "🚩",
      highlight: stats.pendingReports > 0,
    },
    {
      label: "Raporlanmış Uyarlama",
      value: stats.flaggedVariations,
      emoji: "⚠️",
      highlight: stats.flaggedVariations > 0,
    },
  ];

  // İkinci sıra — kataloğun büyüme hızı.
  const activityCards = [
    { label: "Bugün", value: stats.recipesToday, emoji: "🌅" },
    { label: "Bu hafta", value: stats.recipesThisWeek, emoji: "📅" },
    { label: "Bu ay", value: stats.recipesThisMonth, emoji: "📆" },
  ];

  // Mini bar chart için max değer — sütun yüksekliklerini normalize eder.
  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-heading text-xl font-bold">Genel Bakış</h2>
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
          Son tarif eklenme aktivitesi
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

      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          Son seed batch&apos;leri
        </h3>
        {batches.length === 0 ? (
          <p className="text-sm text-text-muted">
            Henüz batch yok (5+ tarif aynı saatte INSERT olunca burada görünür).
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated/40 text-left">
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                    Tarih · saat (UTC)
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                    Tarif sayısı
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
          Saatlik bucket&apos;lar — aynı saatte 5+ tarif INSERT&apos;lendiyse burada görünür.
        </p>
      </section>

      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          Kategori dağılımı
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
    </div>
  );
}
