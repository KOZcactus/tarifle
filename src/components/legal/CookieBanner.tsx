"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * localStorage anahtarı, versioned. Çerez politikası güncellendiğinde
 * (örn. yeni çerez türü eklenirse) bu sürümü bump edip tüm kullanıcılara
 * banner'ı yeniden göstermek mümkün. Şu an v1 çünkü politika v1.0.
 */
const STORAGE_KEY = "tarifle.cookieNotice.v1.dismissed";

/**
 * Cookie banner, sade, bilgilendirici. GDPR/ePrivacy prensibi uyarınca
 * consent kutusu değil çünkü Tarifle sadece zorunlu çerez kullanıyor
 * (session + CSRF + locale + theme). Zorunlu çerezler için ayrı onay
 * gerekmiyor; banner sadece şeffaflık amaçlı.
 *
 * Davranış:
 *   - İlk ziyarette fade-in ile ekranın altında sabitlenir
 *   - "Anladım" tıklanınca localStorage'da dismissed flag set edilir,
 *     banner fade-out + unmount
 *   - SSR'da hiçbir şey render edilmez, yalnız mount sonrası banner
 *     görünür (hydration mismatch önlemi)
 *   - localStorage erişilemezse (private mode, vb.) banner görünür ama
 *     dismiss persist etmez, kullanıcı her sayfada kapatır
 *
 * Konum: root layout içinde mount edilir. z-50 ile her şeyin üstünde;
 * ancak modal/dialog gibi overlay'lerle çakışma yok çünkü bottom-4 +
 * max-w ile ekranın alt kısmına oturur.
 */
export function CookieBanner() {
  // null = SSR + hydration öncesi; false = dismissed değil; true = dismissed.
  // Mount sonrası effect'te gerçek durum set edilir, bu kasıtlı hydration
  // korumasıdır (SSR localStorage'a erişemez). eslint kuralı cascading
  // render'dan şikayet ediyor ama burada tek sefer + conditional, intentional.
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const t = useTranslations("cookieBanner");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(stored === "1");
    } catch {
      // localStorage engeli (private mode, güvenlik ayarları). Banner'ı
      // yine de göster ama persist etmeyeceğiz.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
    }
  }, []);

  function handleAccept(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Persist edemediğimiz durumda bile banner'ı kapat, session içinde
      // rahatsız etmesin.
    }
    setDismissed(true);
  }

  // Mount öncesi hiçbir şey render etme (SSR HTML === client HTML).
  if (dismissed === null || dismissed === true) return null;

  return (
    <div
      role="region"
      aria-label={t("ariaLabel")}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border border-border bg-bg-card shadow-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm leading-relaxed text-text-muted">
          <span aria-hidden="true" className="mr-1">
            🍪
          </span>
          {t("message")}
        </p>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link
            href="/yasal/cerez-politikasi"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
          >
            {t("detailsLabel")}
          </Link>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {t("acceptLabel")}
          </button>
        </div>
      </div>
    </div>
  );
}
