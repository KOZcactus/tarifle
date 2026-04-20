"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  trackAppInstalled,
  trackInstallAccepted,
  trackInstallDismissed,
  trackInstallPrompted,
  trackIosFallbackShown,
  trackPromptAvailable,
} from "@/lib/pwa-analytics";

/**
 * "Ana ekrana ekle" promosyon bandı, mobil retention loop.
 *
 * Android / Chromium: `beforeinstallprompt` event yakalanır, kullanıcı
 * "Ekle" butonuna basınca `prompt()` tetiklenir. Native sheet onay/red
 * döndürür.
 *
 * iOS Safari: `beforeinstallprompt` yayınlamaz, manuel yol göstermek
 * gerekiyor. User-agent'tan iOS Safari tespiti yapılıp talimat modu
 * render edilir ("Paylaş → Ana Ekrana Ekle").
 *
 * Zamanlama kuralları (session 11 refinement):
 *   - İlk ziyarette GÖSTERILMEZ. Kullanıcı siteyi tanımadan install
 *     teklifi conversion'ı düşürür (premature commitment).
 *   - 2. ziyaret veya aynı ziyarette 45s+ aktif süre → banner uygun.
 *   - 3s güvenlik gecikmesi (CLS'yi bozmasın) + engagement check.
 *
 * Dismissal progressive:
 *   - 1. dismiss → 30 gün cooldown
 *   - 2. dismiss → 90 gün cooldown
 *   - 3. dismiss → kalıcı, hiç gösterilmez (ısrar karşıtı hedef kitle).
 *
 * Zaten installed (`display-mode: standalone`) veya iOS
 * `navigator.standalone` true ise hiç render edilmez.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_COUNT_KEY = "pwa-install-dismiss-count";
const VISIT_COUNT_KEY = "pwa-visit-count";
const VISIT_SEEN_KEY = "pwa-visit-session-seen";

// Progressive cooldown: 1→30 gün, 2→90 gün, 3+→kalıcı sessizlik
const DISMISS_COOLDOWNS_MS = [
  30 * 24 * 60 * 60 * 1000,
  90 * 24 * 60 * 60 * 1000,
];

const SHOW_DELAY_MS = 3000;
// Engagement gate: 2+ ziyaret VEYA aynı session'da 45s+ aktif süre
const MIN_VISITS = 2;
const ENGAGEMENT_MS = 45_000;

type Mode = "hidden" | "native" | "ios";

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)");
  if (mq?.matches) return true;
  // iOS specific legacy flag
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    const count = Number(localStorage.getItem(DISMISS_COUNT_KEY) ?? "1");
    // 3+ dismiss → kalıcı sessizlik (hiçbir cooldown eşleşmesin)
    if (count >= DISMISS_COOLDOWNS_MS.length + 1) return true;
    const cooldown =
      DISMISS_COOLDOWNS_MS[Math.min(count - 1, DISMISS_COOLDOWNS_MS.length - 1)];
    return Date.now() - ts < cooldown;
  } catch {
    return false;
  }
}

/**
 * Visit counter: oturum başına 1 artar (session storage flag ile
 * duplicate artışı engelle). localStorage kalıcı.
 */
function bumpVisitCount(): number {
  try {
    const seenThisSession = sessionStorage.getItem(VISIT_SEEN_KEY);
    if (seenThisSession) {
      return Number(localStorage.getItem(VISIT_COUNT_KEY) ?? "0");
    }
    const current = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? "0");
    const next = current + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(next));
    sessionStorage.setItem(VISIT_SEEN_KEY, "1");
    return next;
  } catch {
    return 0;
  }
}

function recordDismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    const count = Number(localStorage.getItem(DISMISS_COUNT_KEY) ?? "0") + 1;
    localStorage.setItem(DISMISS_COUNT_KEY, String(count));
  } catch {
    /* no-op */
  }
}

export function PWAInstallBanner() {
  const t = useTranslations("pwa.install");
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    // Engagement gate: önce visit count'u bump et, sonra karar ver.
    const visits = bumpVisitCount();
    const engagedByVisits = visits >= MIN_VISITS;

    let nativeTimer: ReturnType<typeof setTimeout> | null = null;
    let iosTimer: ReturnType<typeof setTimeout> | null = null;
    let engagementTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingMode: Mode | null = null;

    const reveal = (m: Mode) => {
      setMode(m);
    };

    const scheduleReveal = (m: Mode) => {
      if (engagedByVisits) {
        // 2+ ziyaret: kısa güvenlik gecikmesi yeterli
        nativeTimer = setTimeout(() => reveal(m), SHOW_DELAY_MS);
      } else {
        // İlk ziyaret: 45s engagement bekle
        pendingMode = m;
        engagementTimer = setTimeout(() => {
          if (pendingMode) reveal(pendingMode);
        }, ENGAGEMENT_MS);
      }
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const evt = event as BeforeInstallPromptEvent;
      setDeferredPrompt(evt);
      trackPromptAvailable();
      scheduleReveal("native");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS Safari için native event yok, engagement gate ile banner'ı
    // gecikmeli göster.
    if (isIosSafari()) {
      const showIos = () => {
        reveal("ios");
        trackIosFallbackShown();
      };
      if (engagedByVisits) {
        iosTimer = setTimeout(showIos, SHOW_DELAY_MS);
      } else {
        pendingMode = "ios";
        engagementTimer = setTimeout(() => {
          if (pendingMode === "ios") showIos();
        }, ENGAGEMENT_MS);
      }
    }

    const onAppInstalled = () => {
      setMode("hidden");
      trackAppInstalled();
    };
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      if (nativeTimer) clearTimeout(nativeTimer);
      if (iosTimer) clearTimeout(iosTimer);
      if (engagementTimer) clearTimeout(engagementTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    trackInstallPrompted();
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setMode("hidden");
    if (choice.outcome === "accepted") {
      trackInstallAccepted();
    } else {
      recordDismiss();
      trackInstallDismissed("prompt-sheet");
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    recordDismiss();
    trackInstallDismissed("banner-x");
    setMode("hidden");
  }, []);

  if (mode === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="pwa-install-title"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-border bg-bg-card shadow-lg print:hidden sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[360px]"
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl"
          aria-hidden="true"
        >
          📲
        </div>
        <div className="min-w-0 flex-1">
          <p
            id="pwa-install-title"
            className="text-sm font-semibold text-text"
          >
            {t("title")}
          </p>
          <p className="mt-1 text-xs leading-snug text-text-muted">
            {mode === "ios" ? t("iosBody") : t("nativeBody")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {mode === "native" && deferredPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                {t("nativeCta")}
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text"
            >
              {mode === "ios" ? t("iosDismiss") : t("nativeDismiss")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("closeAria")}
          className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
