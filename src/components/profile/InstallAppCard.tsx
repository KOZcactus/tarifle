"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  getStoredPrompt,
  setStoredPrompt,
  subscribePromptStore,
} from "@/lib/pwa-prompt-store";
import {
  trackAppInstalled,
  trackInstallAccepted,
  trackInstallDismissed,
  trackInstallPrompted,
} from "@/lib/pwa-analytics";

/**
 * /ayarlar sayfasinda manuel "Uygulamayi Yukle" karti.
 *
 * Banner kalici dismiss sonrasi devre disi kalsa bile kullanici buradan
 * istedigi an yukleyebilir. Cihaz/tarayici kombinasyonuna gore uc mod:
 *   - "installed": display-mode: standalone => yuklu, mesaj
 *   - "native": Chromium beforeinstallprompt yakalandi => prompt() butonu
 *   - "ios": iOS Safari => manuel talimat (Paylas → Ana Ekrana Ekle)
 *   - "fallback": ne native event ne iOS Safari => tarayici menusunden
 *     manuel talimat (Chrome desktop "Install" simgesi vs.)
 */

type Mode = "loading" | "installed" | "native" | "ios" | "fallback";

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
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function InstallAppCard() {
  const t = useTranslations("settings.installApp");
  const [hydrated, setHydrated] = useState(false);
  const [installedManually, setInstalledManually] = useState(false);
  const storedPrompt = useSyncExternalStore(
    subscribePromptStore,
    getStoredPrompt,
    () => null,
  );

  useEffect(() => {
    // SSR/CSR boundary: standalone + iOS detection sadece browser'da
    // dogru calisir. Hydration sonrasi flag'i ac, mode hesaplansin.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const mode: Mode = useMemo(() => {
    if (!hydrated) return "loading";
    if (installedManually || isStandalone()) return "installed";
    if (storedPrompt) return "native";
    if (isIosSafari()) return "ios";
    return "fallback";
  }, [hydrated, installedManually, storedPrompt]);

  const handleInstall = useCallback(async () => {
    if (!storedPrompt) return;
    trackInstallPrompted();
    await storedPrompt.prompt();
    const choice = await storedPrompt.userChoice;
    setStoredPrompt(null);
    if (choice.outcome === "accepted") {
      trackInstallAccepted();
      trackAppInstalled();
      setInstalledManually(true);
    } else {
      trackInstallDismissed("manual-card");
    }
  }, [storedPrompt]);

  if (mode === "loading") return null;

  return (
    <section className="rounded-2xl border border-border bg-bg-card p-5 shadow-sm">
      <header className="mb-3 flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl"
          aria-hidden="true"
        >
          📲
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold text-text">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
        </div>
      </header>

      {mode === "installed" && (
        <p className="rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-muted">
          {t("installed")}
        </p>
      )}

      {mode === "native" && (
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t("nativeCta")}
        </button>
      )}

      {mode === "ios" && (
        <p className="rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-muted">
          {t("iosBody")}
        </p>
      )}

      {mode === "fallback" && (
        <p className="rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-muted">
          {t("fallbackBody")}
        </p>
      )}
    </section>
  );
}
