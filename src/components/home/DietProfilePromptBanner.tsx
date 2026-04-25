"use client";

/**
 * Diyet profili tercih CTA banner (oturum 20, DIET_SCORE_PLAN B*).
 *
 * Login + dietProfile NULL kullaniciya anasayfa ustunde "Diyet tercih
 * eder misin?" CTA. Tercih ettiginde her tarifin sana ozel diyet uyum
 * skoru gorunur (Beta). localStorage dismiss flag ile kullanici 'x'
 * basinca kalici kapanir.
 *
 * ProfileIncompleteBanner'in pattern'ini takip eder; bagimsiz dismiss
 * key (cakisma yok). Misafir veya zaten dietProfile set'li kullanicida
 * server-side false geldigi icin hic render etmez.
 */

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const DISMISS_KEY = "tarifle:diet-banner-dismissed";

interface DietProfilePromptBannerProps {
  /**
   * Server-side belirlenen banner gorunurluk: login + dietProfile null
   * + onboarding'den kapatilmamis. False ise component hic render etmez.
   */
  show: boolean;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string {
  return localStorage.getItem(DISMISS_KEY) ?? "0";
}

function getServerSnapshot(): string {
  return "0";
}

export function DietProfilePromptBanner({ show }: DietProfilePromptBannerProps) {
  const storedFlag = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localDismissed, setLocalDismissed] = useState(false);
  const dismissed = storedFlag === "1" || localDismissed;

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setLocalDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Diyet tercihi öneri"
      className="mx-auto mb-6 flex max-w-4xl items-center gap-3 rounded-xl border border-amber-300/40 bg-amber-50/50 px-4 py-3 text-sm dark:border-amber-700/40 dark:bg-amber-900/10 sm:px-5"
    >
      <span className="text-xl" aria-hidden="true">
        🎯
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text">
          Diyet tercih ediyor musun?{" "}
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            Beta
          </span>
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          Tercih ettiğinde her tarifte sana özel uyum skoru gösteririz, listelemeyi
          uyumuna göre sıralayabilirsin.
        </p>
      </div>
      <Link
        href="/ayarlar#diyet"
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Diyet seç
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Banner'ı kapat"
        className="shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
