import { getAdminStats } from "@/lib/queries/admin";

export const metadata = { title: "Yönetim Paneli | Tarifle" };

export default async function AdminPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Toplam Tarif", value: stats.totalRecipes, emoji: "📖" },
    { label: "Toplam Kullanıcı", value: stats.totalUsers, emoji: "👥" },
    { label: "Toplam Uyarlama", value: stats.totalVariations, emoji: "🔄" },
    { label: "Bekleyen Rapor", value: stats.pendingReports, emoji: "🚩", highlight: stats.pendingReports > 0 },
    { label: "Raporlanmış Uyarlama", value: stats.flaggedVariations, emoji: "⚠️", highlight: stats.flaggedVariations > 0 },
  ];

  return (
    <div>
      <h2 className="mb-6 font-heading text-xl font-bold">Genel Bakış</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 ${
              card.highlight
                ? "border-error/30 bg-error/5"
                : "border-border bg-bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{card.emoji}</span>
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
    </div>
  );
}
