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
};
