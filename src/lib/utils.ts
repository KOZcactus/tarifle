import { type ClassValue, clsx } from "clsx";
import slugifyLib from "slugify";

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: "tr",
  });
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} sa`;
  return `${hours} sa ${remaining} dk`;
}

export function getDifficultyLabel(difficulty: "EASY" | "MEDIUM" | "HARD"): string {
  const labels = {
    EASY: "Kolay",
    MEDIUM: "Orta",
    HARD: "Zor",
  } as const;
  return labels[difficulty];
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
