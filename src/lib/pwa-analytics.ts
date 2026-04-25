/**
 * PWA install analytics.
 *
 * Tarih notu: Oturum 15'e kadar tüm PWA event'leri `Sentry.captureMessage`
 * ile info-level mesaj olarak gönderilmişti. Sentry bu mesajları "issue"
 * sayıp her dismiss'te email bildirimi tetikliyordu (noise). Oturum 16'da
 * (23 Nisan 2026) Vercel Analytics'e geçildi:
 *
 *   - Conversion + funnel metrikleri → Vercel Analytics custom events
 *     (100k event/ay Pro dahil, GDPR/KVKK cookie-less)
 *   - Sentry tarafı sadece breadcrumb (hata anında debug context) +
 *     kullanıcı-kapsamı tag (pwa.installed, pwa.native_available) olarak
 *     kullanılır; `captureMessage` artık yapılmıyor.
 *
 * Vercel Analytics dashboard filter örnek:
 *   "pwa.install.accepted where source=banner"   → banner conversion
 *   "pwa.install.dismissed where source=banner-x"→ X tıklama oranı
 *
 * LocalStorage metrics (client-side, admin widget için ileride):
 *   - `pwa-prompt-count`: toplam beforeinstallprompt fire sayısı
 *   - `pwa-install-outcome-last`: son outcome ("accepted"|"dismissed")
 *   - `pwa-install-outcome-at`: son outcome epoch ms
 */
import { track } from "@vercel/analytics";
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
  track("pwa.prompt.available");
  safeLocalStorage(() => {
    const cur = Number(localStorage.getItem(LS_PROMPT_COUNT) ?? "0");
    localStorage.setItem(LS_PROMPT_COUNT, String(cur + 1));
  });
}

/** Event 2: user tapped install button in our banner (deferredPrompt
 *  .prompt() tetiklenecek). */
export function trackInstallPrompted(): void {
  Sentry.addBreadcrumb({
    category: "pwa",
    message: "install prompted (banner button)",
    level: "info",
  });
  track("pwa.install.prompted", { source: "banner" });
}

/** Event 3a: native sheet outcome = accepted. */
export function trackInstallAccepted(): void {
  Sentry.setTag("pwa.install.outcome", "accepted");
  Sentry.addBreadcrumb({
    category: "pwa",
    message: "install accepted",
    level: "info",
  });
  track("pwa.install.accepted", { source: "banner" });
  safeLocalStorage(() => {
    localStorage.setItem(LS_OUTCOME_LAST, "accepted");
    localStorage.setItem(LS_OUTCOME_AT, String(Date.now()));
  });
}

/** Event 3b: native sheet outcome = dismissed, VEYA banner X basıldı,
 *  VEYA /ayarlar manuel install card'da reddedildi. */
export function trackInstallDismissed(
  source: "prompt-sheet" | "banner-x" | "manual-card",
): void {
  Sentry.setTag("pwa.install.outcome", "dismissed");
  Sentry.addBreadcrumb({
    category: "pwa",
    message: `install dismissed (${source})`,
    level: "info",
  });
  track("pwa.install.dismissed", { source });
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
  track("pwa.ios_fallback.shown");
}

/** Event 5: appinstalled event fired (OS confirms PWA installed). En
 *  güvenilir conversion sinyali, userChoice dismiss olsa bile bazen
 *  OS later install ederse bu gelir. */
export function trackAppInstalled(): void {
  Sentry.setTag("pwa.installed", "true");
  Sentry.addBreadcrumb({
    category: "pwa",
    message: "app installed",
    level: "info",
  });
  track("pwa.app.installed");
  safeLocalStorage(() => {
    localStorage.setItem(LS_OUTCOME_LAST, "installed");
    localStorage.setItem(LS_OUTCOME_AT, String(Date.now()));
  });
}
