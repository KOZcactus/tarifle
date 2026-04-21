"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const COOKIE_NAME = "tarifle_age_18";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 yil
// Legacy sessionStorage anahtari (v1): onceki gate implementasyonu
// oturum baziydi. Mevcut kullanicilar icin gecis hedefi: cookie
// oturumdan kalciya geci.
const LEGACY_SESSION_KEY = "tarifle_age_verified";

/**
 * Alkollu tarif sayfalarinda 18+ yas dogrulama overlay'i.
 *
 * Mimari (v2, oturum 12 refactor):
 *   - Onceki surum <AgeGate>{children}</AgeGate> wrapper idi; verified
 *     false iken hic content render etmiyordu. SSR HTML bos donuyordu,
 *     Google bot alkollu tarif detayini goremiyordu (GPT audit'inde
 *     "neredeyse sadece header/footer" tespiti) ve rich result + organik
 *     trafik sinyali kayboluyordu.
 *   - Yeni surum: overlay komponenti, parent sayfa icerigin ustune
 *     render eder. Content DOM'da her zaman mevcut, Google bot indexler,
 *     kullanici onay verene kadar overlay ile gorunmez.
 *
 * Cookie (v2, max-age 1 yil):
 *   - Onceki surum sessionStorage idi, tab kapatildiginda tekrar sorunuyordu.
 *   - tarifle_age_18=1 cookie, path=/ samesite=lax secure; Secure flag
 *     prod'da HTTPS gerektirir (tarifle.app HTTPS-only).
 *   - Legacy sessionStorage migrate: ilk mount'ta okur, cookie set eder,
 *     session key'i siler. Mevcut onayli kullanici tekrar sorulmaz.
 *
 * "Hayir, ayril":
 *   - router.push("/") ana sayfaya cikar (onceki surum history.back idi,
 *     external link'ten gelen kullanici geri donemiyordu).
 */
function writeAgeCookie() {
  const flags = [
    `${COOKIE_NAME}=1`,
    `max-age=${COOKIE_MAX_AGE}`,
    "path=/",
    "samesite=lax",
  ];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    flags.push("secure");
  }
  document.cookie = flags.join("; ");
}

export function AgeGate() {
  const t = useTranslations("ageGate");
  const [open, setOpen] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Cookie oncelik; set ise hic modal acilmaz.
    const verifiedViaCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith(`${COOKIE_NAME}=1`));
    if (verifiedViaCookie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      return;
    }

    // Legacy migrate: sessionStorage'da v1 onay varsa cookie'ye tasi,
    // storage'i temizle.
    try {
      if (sessionStorage.getItem(LEGACY_SESSION_KEY) === "true") {
        writeAgeCookie();
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(false);
        return;
      }
    } catch {
      // sessionStorage erisim hatasi (iframe sandbox vs), sessizce gec.
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, []);

  function handleConfirm() {
    writeAgeCookie();
    setOpen(false);
  }

  function handleDecline() {
    router.push("/");
  }

  // Initial null = mount oncesi; kapali veya onayli durumda overlay yok.
  if (open !== true) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-bg p-8 text-center shadow-2xl">
        <span aria-hidden="true" className="mb-4 inline-block text-5xl">
          🍸
        </span>
        <h2
          id="age-gate-title"
          className="font-heading text-xl font-bold text-text"
        >
          {t("title")}
        </h2>
        <p id="age-gate-desc" className="mt-3 text-sm text-text-muted">
          {t("description")}
        </p>
        <div className="mt-3 rounded-lg bg-secondary/10 px-3 py-2">
          <p className="text-xs text-secondary">{t("responsibility")}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t("confirm")}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated"
          >
            {t("back")}
          </button>
        </div>
      </div>
    </div>
  );
}
