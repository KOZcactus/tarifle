import type { BadgeKey } from "@prisma/client";

export interface BadgeMeta {
  label: string;
  description: string;
  emoji: string;
  /** Tone-color for the badge chip, maps to design tokens. */
  tone: "blue" | "green" | "gold" | "primary";
}

/**
 * Static badge catalogue. Adding a badge means: 1) extend BadgeKey enum in
 * prisma schema + migrate, 2) add an entry here, 3) award it from the relevant
 * trigger in `lib/badges/service.ts`.
 */
export const BADGES: Record<BadgeKey, BadgeMeta> = {
  EMAIL_VERIFIED: {
    label: "Doğrulanmış",
    description: "E-postanı doğruladın.",
    emoji: "✓",
    tone: "blue",
  },
  FIRST_VARIATION: {
    label: "İlk Uyarlama",
    description: "İlk uyarlamanı paylaştın.",
    emoji: "🌱",
    tone: "green",
  },
  POPULAR_VARIATION: {
    label: "Popüler Uyarlama",
    description: "Bir uyarlaman 10+ beğeni aldı.",
    emoji: "🔥",
    tone: "gold",
  },
  RECIPE_COLLECTOR: {
    label: "Koleksiyoncu",
    description: "5+ koleksiyon oluşturdun.",
    emoji: "📚",
    tone: "primary",
  },
  // Faz 1 topluluk rozetleri (oturum 12+):
  EXPERIENCED: {
    label: "Deneyimli",
    description: "5+ uyarlama paylaştın.",
    emoji: "⭐",
    tone: "gold",
  },
  PHOTOGRAPHER: {
    label: "Fotoğrafçı",
    description: "10+ tarif fotoğrafı paylaştın.",
    emoji: "📸",
    tone: "blue",
  },
  CATEGORY_MASTER: {
    label: "Kategori Ustası",
    description: "Bir kategoride 5+ uyarlama paylaştın.",
    emoji: "👑",
    tone: "primary",
  },
  EDITOR_CHOICE: {
    label: "Editör Seçimi",
    description: "Tarifle editörü senin uyarlamanı öne çıkardı.",
    emoji: "🏆",
    tone: "gold",
  },
  WEEKLY_TOP_10: {
    label: "Haftalık Top 10",
    description: "Bir hafta liderlik tablosunda Top 10'a girdin.",
    emoji: "🥇",
    tone: "gold",
  },
  MONTHLY_TOP_10: {
    label: "Aylık Top 10",
    description: "Bir ay liderlik tablosunda Top 10'a girdin.",
    emoji: "🏅",
    tone: "gold",
  },
  ALL_TIME_TOP_50: {
    label: "Efsane",
    description: "Tüm zamanlar liderlik Top 50'sine girdin.",
    emoji: "💎",
    tone: "primary",
  },
};
