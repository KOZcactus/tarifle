/**
 * Hero tagline A/B test variant assignment (oturum 13 minimal kurulum).
 *
 * Variant'lar:
 *   - A (control): "Bugün ne pişirsek?" / "What shall we cook today?"
 *   - B (test):    "Aklındaki malzemeyle yeni bir şey" / "Something new
 *                   with what's on your counter"
 *
 * Cookie: `tarifle_hero_v` (Lax, 30 gun, browser sticky). Server cookie
 * varsa onu kullanir; yoksa server-side deterministic random (Math.random
 * sufficient bu MVP icin), HeroVariantInit client component cookie'yi
 * tarayicida persist eder.
 *
 * Tracking: HeroVariantInit Sentry tag set eder (`hero.variant: A|B`),
 * ileride Plausible/PostHog eklenirse conversion attribution mumkun.
 *
 * Genisletme yolu: yeni variant ekle (C, D), pickVariant'a probability
 * tablosu, i18n key suffix de (A/B/C/D ...). Edge Config'e tasinabilir
 * (zoraki degil, sticky cookie zaten yeterli).
 */

export type HeroVariant = "A" | "B";

export const HERO_VARIANT_COOKIE = "tarifle_hero_v";

export const HERO_VARIANTS: HeroVariant[] = ["A", "B"];

/**
 * Cookie deger -> variant. Gecersiz/yoksa rastgele 50/50 pick.
 * Server side: Math.random kabul; deterministic gerekirse session id
 * hash'i veya request fingerprint olur (su an gerekmiyor).
 */
export function pickVariant(cookieValue: string | undefined): HeroVariant {
  if (cookieValue === "A" || cookieValue === "B") {
    return cookieValue;
  }
  return Math.random() < 0.5 ? "A" : "B";
}

/** i18n key adapter: heroTitle (control) veya heroTitleVariantB. */
export function heroTitleI18nKey(variant: HeroVariant): "heroTitle" | "heroTitleVariantB" {
  return variant === "B" ? "heroTitleVariantB" : "heroTitle";
}
