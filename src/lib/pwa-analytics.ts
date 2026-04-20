/**
 * PWA install analytics, Sentry breadcrumb + custom event olarak.
 *
 * Tarifle'de ayrı analytics backend yok (Plausible/GA yok); Sentry'nin
 * ücretsiz event quota'sı (10k event/ay) PWA conversion tracking için
 * yeterli. Breadcrumb + tag kombinasyonu:
 *
 *   - `pwa.native_available` tag: beforeinstallprompt fire olduysa true.
 *     Session başına setlenir. Admin Sentry dashboard'da filter:
 *     "pwa.native_available:true AND pwa.install.outcome:accepted"
 *     conversion oranını verir.
 *
 *   - `captureMessage('pwa.install.prompted', level:info)`: kullanıcı
 *     install butonuna bastı (deferredPrompt.prompt()).
 *
 *   - `captureMessage('pwa.install.accepted', level:info)`: native
 *     sheet'te "Ekle" seçildi.
 *
 *   - `captureMessage('pwa.install.dismissed', level:info)`: native
 *     sheet'te "Vazgeç" seçildi VEYA banner X'e basıldı.
 *
 *   - `pwa.ios_fallback` tag: iOS Safari banner gösterildi (native
 *     prompt yok, manual "Paylaş → Ana Ekrana Ekle").
 *
 * LocalStorage metrics (client-side, admin widget için ileride):
 *   - `pwa-prompt-count`: toplam beforeinstallprompt fire sayısı
 *   - `pwa-install-outcome-last`: son outcome ("accepted"|"dismissed")
 *   - `pwa-install-outcome-at`: son outcome epoch ms
 */
import * as Sentry from "@sentry/nextjs";

const LS_PROMPT_COUNT = "pwa-prompt-count";
const LS_OUTCOME_LAST = "pwa-install-outcome-last";
const LS_OUTCOME_AT = "pwa-install-outcome-at";

function safeLocalStorage(op: () => void): void {
  try {
    op();
  } catch {
    /* no-op, SSR or private mode */
  }
}

/** Event 1: native beforeinstallprompt fired (Chromium only). */
export function trackPromptAvailable(): void {
  Sentry.setTag("pwa.native_available", "true");
  Sentry.addBreadcrumb({
    category: "pwa",
    message: "beforeinstallprompt fired",
    level: "info",
  });
  safeLocalStorage(() => {
    const cur = Number(localStorage.getItem(LS_PROMPT_COUNT) ?? "0");
    localStorage.setItem(LS_PROMPT_COUNT, String(cur + 1));
  });
}

/** Event 2: user tapped install button in our banner (deferredPrompt
 *  .prompt() tetiklenecek). */
export function trackInstallPrompted(): void {
  Sentry.captureMessage("pwa.install.prompted", {
    level: "info",
    tags: { "pwa.source": "banner" },
  });
}

/** Event 3a: native sheet outcome = accepted. */
export function trackInstallAccepted(): void {
  Sentry.setTag("pwa.install.outcome", "accepted");
  Sentry.captureMessage("pwa.install.accepted", {
    level: "info",
    tags: { "pwa.source": "banner" },
  });
  safeLocalStorage(() => {
    localStorage.setItem(LS_OUTCOME_LAST, "accepted");
    localStorage.setItem(LS_OUTCOME_AT, String(Date.now()));
  });
}

/** Event 3b: native sheet outcome = dismissed, VEYA banner X basıldı. */
export function trackInstallDismissed(source: "prompt-sheet" | "banner-x"): void {
  Sentry.setTag("pwa.install.outcome", "dismissed");
  Sentry.captureMessage("pwa.install.dismissed", {
    level: "info",
    tags: { "pwa.source": source },
  });
  safeLocalStorage(() => {
    localStorage.setItem(LS_OUTCOME_LAST, "dismissed");
    localStorage.setItem(LS_OUTCOME_AT, String(Date.now()));
  });
}

/** Event 4: iOS Safari fallback banner shown (native prompt yok). */
export function trackIosFallbackShown(): void {
  Sentry.setTag("pwa.ios_fallback", "true");
  Sentry.addBreadcrumb({
    category: "pwa",
    message: "iOS Safari manual install banner shown",
    level: "info",
  });
}

/** Event 5: appinstalled event fired (OS confirms PWA installed). En
 *  güvenilir conversion sinyali, userChoice dismiss olsa bile bazen
 *  OS later install ederse bu gelir. */
export function trackAppInstalled(): void {
  Sentry.setTag("pwa.installed", "true");
  Sentry.captureMessage("pwa.app.installed", {
    level: "info",
  });
  safeLocalStorage(() => {
    localStorage.setItem(LS_OUTCOME_LAST, "installed");
    localStorage.setItem(LS_OUTCOME_AT, String(Date.now()));
  });
}
