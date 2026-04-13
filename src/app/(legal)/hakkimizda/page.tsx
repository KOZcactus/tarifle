import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Tarifle hakkında bilgi edinin.",
};

export default function HakkimizdaPage() {
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
          kendi varyasyonlarını paylaşabilecekleri bir topluluk oluşturmaktır.
        </p>
        <p>
          Tarifler kısa, göz yormayan, anlaşılır ve pratik olacak şekilde hazırlanır. Her tarif
          kartında süre, zorluk, kategori, ortalama kalori ve varyasyon sayısı görünür.
        </p>
      </div>
    </div>
  );
}
