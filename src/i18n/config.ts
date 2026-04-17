/**
 * i18n konfigürasyonu — tek kaynak liste. Yeni locale eklerken burayı
 * güncelle + `messages/{locale}.json` dosyasını ekle. Middleware /
 * cookie okuma / validation hepsi buradan beslenir.
 *
 * Tarifle primary language TR — default bu. EN Faz 3'te eklendi,
 * user açıkça seçmezse TR kalır. DE / FR ileride buraya eklenecek.
 */

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tr";

export const LOCALE_LABELS: Record<Locale, { name: string; flag: string }> = {
  tr: { name: "Türkçe", flag: "🇹🇷" },
  en: { name: "English", flag: "🇬🇧" },
};

export function isValidLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
