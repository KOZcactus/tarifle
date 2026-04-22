"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { HERO_VARIANT_COOKIE, type HeroVariant } from "@/lib/experiments/hero-tagline";

interface HeroVariantInitProps {
  /** Server-side picked variant. Bu component cookie'yi persist + Sentry
   *  tag setler; render etmez. */
  variant: HeroVariant;
}

/**
 * Hero A/B variant cookie persist + Sentry tag setter. Server tarafi
 * cookie yoksa rastgele variant secer, bu component mount edince
 * 30 gunluk Lax cookie atar (sonraki ziyaretlerde sticky). Sentry'ye
 * tag yazar, ileride conversion analizi mumkun.
 *
 * Render: null. Sadece side-effect.
 */
export function HeroVariantInit({ variant }: HeroVariantInitProps) {
  useEffect(() => {
    // Cookie persist (30 gun = 30*24*60*60 = 2592000 saniye)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${HERO_VARIANT_COOKIE}=${variant}; expires=${expires}; path=/; SameSite=Lax`;

    // Sentry tag, future analiz icin (paid Sentry'de Issues filter
    // edilebilir, conversion event'iyle correlation kolay).
    Sentry.setTag("hero.variant", variant);
  }, [variant]);

  return null;
}
