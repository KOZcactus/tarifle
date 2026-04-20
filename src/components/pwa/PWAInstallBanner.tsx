"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
 * Dismissal: localStorage `pwa-install-dismissed-at`. Kapandıktan sonra
 * 30 gün gösterilmez. Zaten installed (`display-mode: standalone`)
 * veya `navigator.standalone` (iOS) ise hiç render edilmez.
 *
 * Gösterim gecikmesi: 3s, ilk yüklemede CLS'yi bozmasın, kullanıcı
 * sayfaya yerleşsin.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün
const SHOW_DELAY_MS = 3000;

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
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
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

    let timer: ReturnType<typeof setTimeout> | null = null;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const evt = event as BeforeInstallPromptEvent;
      setDeferredPrompt(evt);
      // 3s gecikme: ilk kareler rahatça renderlensin
      timer = setTimeout(() => setMode("native"), SHOW_DELAY_MS);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS Safari için native event yok, manuel banner'ı 3s sonra göster.
    if (isIosSafari()) {
      timer = setTimeout(() => setMode("ios"), SHOW_DELAY_MS);
    }

    const onAppInstalled = () => setMode("hidden");
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setMode("hidden");
    if (choice.outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* no-op */
      }
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* no-op */
    }
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
