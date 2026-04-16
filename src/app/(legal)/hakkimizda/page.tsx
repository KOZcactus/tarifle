import type { Metadata } from "next";
import { getSiteStats } from "@/lib/queries/site-stats";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Tarifle hakkında bilgi edinin.",
};

// Saatlik revalidate — DB'ye her request'te sorgu gitmez
export const revalidate = 3600;

export default async function HakkimizdaPage() {
  const stats = await getSiteStats();

  const statCards = [
    { label: "Tarif", value: stats.recipeCount, emoji: "📖" },
    { label: "Mutfak", value: stats.cuisineCount, emoji: "🌍" },
    { label: "Kategori", value: stats.categoryCount, emoji: "📂" },
    { label: "Malzeme", value: stats.ingredientCount, emoji: "🥕" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold">Hakkımızda</h1>
      <div className="mt-6 space-y-4 text-text-muted">
        <p>
          <strong className="text-text">Tarifle</strong>, yemek, içecek ve kokteyl tariflerini
          sade, hızlı okunur ve topluluk katkısına açık şekilde sunan modern bir tarif
          platformudur.
        </p>
        <p>
          Amacımız her bilindik yemeğin güvenilir bir genel tarifini sunmak ve kullanıcıların
          kendi uyarlamalarını paylaşabilecekleri bir topluluk oluşturmaktır.
        </p>
        <p>
          Tarifler kısa, göz yormayan, anlaşılır ve pratik olacak şekilde hazırlanır. Her tarif
          kartında süre, zorluk, kategori, ortalama kalori ve uyarlama sayısı görünür.
        </p>
      </div>

      {/* Dynamic stats */}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-bg-card p-4 text-center"
          >
            <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
            <p className="mt-1 text-2xl font-bold text-text">
              {card.value.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-text-muted">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
