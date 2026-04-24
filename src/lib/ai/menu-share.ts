/**
 * AI v4 haftalık menü → WhatsApp / Web Share API metni (oturum 17 #13).
 * Rule-based, sıfır lib. Kullanıcı "Paylaş" butonuna bastığında:
 *   - Mobil: navigator.share({ title, text }) → WhatsApp, Telegram,
 *     SMS, Mail vs. system share sheet
 *   - Desktop: wa.me deep link fallback
 *
 * Format minimalist, emoji + gün başlıkları + her öğün tek satır +
 * link. WhatsApp'ın 4096 karakter mesaj limiti var; 21 slot × ~100
 * char = 2100 char, rahat sığar.
 */
import type { MenuSlot } from "./types";

const DAY_LABELS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

const MEAL_LABELS = {
  BREAKFAST: "🌅 Kahvaltı",
  LUNCH: "🌞 Öğle",
  DINNER: "🌙 Akşam",
} as const;

interface ShareInput {
  slots: MenuSlot[];
  siteUrl?: string;
}

export function buildShareText({
  slots,
  siteUrl = "https://tarifle.app",
}: ShareInput): string {
  const lines: string[] = ["🍳 *Bu haftanın menüsü* (Tarifle)", ""];

  // Group by day
  const byDay = new Map<number, MenuSlot[]>();
  for (const s of slots) {
    if (!s.recipe) continue;
    const arr = byDay.get(s.dayOfWeek) ?? [];
    arr.push(s);
    byDay.set(s.dayOfWeek, arr);
  }

  for (let day = 0; day < 7; day++) {
    const daySlots = byDay.get(day) ?? [];
    if (daySlots.length === 0) continue;
    lines.push(`*${DAY_LABELS[day]}*`);
    // Sort by meal order: BREAKFAST, LUNCH, DINNER
    const order = { BREAKFAST: 0, LUNCH: 1, DINNER: 2 };
    daySlots.sort((a, b) => order[a.mealType] - order[b.mealType]);
    for (const slot of daySlots) {
      if (!slot.recipe) continue;
      const label = MEAL_LABELS[slot.mealType];
      const url = `${siteUrl}/tarif/${slot.recipe.slug}`;
      lines.push(`${label}: ${slot.recipe.title}\n${url}`);
    }
    lines.push("");
  }

  lines.push(`Sen de planla: ${siteUrl}/menu-planlayici`);
  return lines.join("\n");
}

/**
 * WhatsApp deep link: mobilde app açar, desktop'ta web.whatsapp.com.
 * share API mevcutsa tercih, fallback olarak wa.me.
 */
export function buildWhatsAppUrl(shareText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
}
