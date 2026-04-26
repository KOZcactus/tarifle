"use client";

/**
 * Profil eksik tamamla banner (oturum 19 E paketi onboarding polish).
 *
 * Login + profil alanları (bio, image) eksikse ana sayfa üstünde küçük
 * bir prompt: "Profilini tamamla → AI önerileri daha isabetli olur".
 * localStorage dismiss flag ile kullanıcı 'x' basınca kalıcı kapanır.
 *
 * Launch-critical: ilk 10+ kullanıcı bu sayfayı ilk gördüğünde profili
 * boş, AI önerileri generic kalıyor. Banner kişiselleştirmenin değerini
 * hatırlatır ve /ayarlar'a hızlı yönlendirir.
 *
 * I18n: Server-side getTranslations ile çekilen labels prop olarak
 * gelir (oturum 22 fix). useTranslations client tarafında transient
 * NextIntlClientProvider context fail'inde hata fırlatıyordu (Sentry
 * dev tek sefer kayıt); messages prop pattern bu kategoriden bağımsız.
 */

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const DISMISS_KEY = "tarifle:profile-banner-dismissed";

export interface ProfileIncompleteBannerLabels {
  title: string;
  body: string;
  cta: string;
  dismiss: string;
}

interface ProfileIncompleteBannerProps {
  /**
   * Server-side belirlenen profil eksikliği. Sadece login kullanıcılar
   * için render edilir; null ise component kendini göstermez.
   */
  incomplete: boolean;
  /** Server tarafından getTranslations ile çekilmiş etiketler. */
  labels: ProfileIncompleteBannerLabels;
}

// useSyncExternalStore ile localStorage'i subscribe et; SSR'da "0" doner
// (banner gorunur), hydrate sonrasi gercek flag okunur. set-state-in-effect
// anti-pattern'ini bu hook kaldiriyor.
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

export function ProfileIncompleteBanner({
  incomplete,
  labels,
}: ProfileIncompleteBannerProps) {
  const storedFlag = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localDismissed, setLocalDismissed] = useState(false);
  const dismissed = storedFlag === "1" || localDismissed;

  if (!incomplete || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setLocalDismissed(true);
  };

  return (
    <div className="mx-auto mb-6 flex max-w-4xl items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm sm:px-5">
      <span className="text-xl" aria-hidden="true">
        👤
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text">{labels.title}</p>
        <p className="mt-0.5 text-xs text-text-muted">{labels.body}</p>
      </div>
      <Link
        href="/ayarlar"
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        {labels.cta}
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={labels.dismiss}
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
