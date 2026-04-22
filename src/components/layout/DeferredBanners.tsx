"use client";

import dynamic from "next/dynamic";

/**
 * PWA banner + Cookie banner ssr-disabled dynamic import.
 *
 * Iki banner da yalnizca mount sonrasi (localStorage state) gosterilir;
 * SSR HTML'inde anlamli ciktilari yok. Layout'tan dogrudan import
 * edildiklerinde yine de hydration bundle'ina giriyorlardi (~ekstra
 * client JS) ve mainthread'i mesgul ediyorlardi. Burada {ssr: false}
 * ile lazy chunk olarak yuklenirler, ana sayfa LCP'sini bekletmezler.
 *
 * Server component (layout) icinden direkt dynamic({ssr:false}) Next
 * 15+ artik kabul etmiyor; bu sebeple araya client component wrapper
 * konuldu (Next 16 best practice).
 */
const PWAInstallBanner = dynamic(
  () =>
    import("@/components/pwa/PWAInstallBanner").then((m) => ({
      default: m.PWAInstallBanner,
    })),
  { ssr: false },
);

const CookieBanner = dynamic(
  () =>
    import("@/components/legal/CookieBanner").then((m) => ({
      default: m.CookieBanner,
    })),
  { ssr: false },
);

export function DeferredBanners() {
  return (
    <>
      <CookieBanner />
      <PWAInstallBanner />
    </>
  );
}
