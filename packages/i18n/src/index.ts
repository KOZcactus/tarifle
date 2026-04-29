/**
 * @tarifle/i18n
 *
 * Tarifle translations, web + mobile shared.
 *
 * Phase 0 skeleton. Phase 1'de mevcut web `messages/tr.json` +
 * `messages/en.json` dosyalarından sync alınır (build script ile
 * single source). Web `next-intl` + mobile `react-i18next` aynı
 * JSON yapısını okur.
 *
 * Sync zamanı: Phase 0'da `scripts/sync-i18n-to-mobile.ts` yazılır,
 * web messages/ → packages/i18n/translations/{tr,en}.json kopyalar.
 * CI'da diff check missing key fail.
 */

// Phase 0: skeleton; gerçek translations Phase 1'de import edilir
export const placeholderTranslations = {
  tr: {
    appName: "Tarifle",
    welcome: "Hoş geldin",
  },
  en: {
    appName: "Tarifle",
    welcome: "Welcome",
  },
} as const;

export type Locale = keyof typeof placeholderTranslations;
export type TranslationKey = keyof typeof placeholderTranslations.tr;
