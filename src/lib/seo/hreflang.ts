/**
 * hreflang / language alternates helper (oturum 33+).
 *
 * Tarifle next-intl cookie-based locale switching kullanır (URL aynı,
 * cookie ile dil değişir). Subpath yok. Bu yüzden hreflang URL'leri
 * tüm diller için aynı path'e işaret eder, ama Google'a sayfanın hem
 * TR hem EN için uygun olduğu sinyalini verir (multi-region/multi-
 * language site signal).
 *
 * Kullanım, generateMetadata içinde:
 *
 *   import { buildLanguageAlternates } from "@/lib/seo/hreflang";
 *
 *   return {
 *     title: ...,
 *     alternates: {
 *       canonical: "/tarif/adana-kebap",
 *       languages: buildLanguageAlternates("/tarif/adana-kebap"),
 *     },
 *   };
 *
 * Çıktı HTML <head>:
 *   <link rel="alternate" hreflang="tr-TR" href="https://tarifle.app/tarif/adana-kebap" />
 *   <link rel="alternate" hreflang="en-US" href="https://tarifle.app/tarif/adana-kebap" />
 *   <link rel="alternate" hreflang="x-default" href="https://tarifle.app/tarif/adana-kebap" />
 *
 * x-default Google'ın varsayılan locale fallback'i, kullanıcı
 * Accept-Language header'ı tanımlanmamış ülkelerden geldiğinde bu
 * URL'i tercih eder.
 *
 * Spec: https://developers.google.com/search/docs/specialty/international/localized-versions
 */
import { SITE_URL } from "@/lib/constants";

export type LanguageAlternates = Record<string, string>;

/**
 * Tek bir path için TR + EN + x-default hreflang map üretir.
 *
 * @param path - relative path, '/' ile başlamalı (örn. '/tarif/adana-kebap')
 * @returns alternates.languages için kullanıma hazır object
 */
export function buildLanguageAlternates(path: string): LanguageAlternates {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${cleanPath}`;
  return {
    "tr-TR": url,
    "en-US": url,
    "x-default": url,
  };
}

/**
 * Sitemap.xml entries için hreflang alternates üretir
 * (MetadataRoute.Sitemap.alternates.languages convention).
 *
 * @param path - aynı buildLanguageAlternates ile
 * @returns Next.js sitemap.ts içinde kullanıma hazır
 */
export function buildSitemapAlternates(path: string): {
  languages: LanguageAlternates;
} {
  return { languages: buildLanguageAlternates(path) };
}
