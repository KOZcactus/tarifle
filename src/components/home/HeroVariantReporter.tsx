"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface HeroVariantReporterProps {
  variant: "A" | "B";
}

/**
 * Client-side telemetri: hero A/B variant'ini Sentry breadcrumb +
 * scope tag olarak bildirir. Server tarafında karar (page.tsx
 * cookies()'den okur) verildi; burada sadece raporlama.
 *
 * Amac: Sentry session replay / issue'lar icinde variant tag'i ile
 * filtrelenebilir veri havuzu. A/B dagilimi ve engagement metrikleri
 * daha sonra Sentry dashboard (tag: hero_variant=A vs B) uzerinden
 * kiyaslanir. Manuel tagging ihtiyaci yok, her home page ziyaretinde
 * otomatik set olur.
 *
 * Minimum footprint: sadece ilk mount'ta scope tag + breadcrumb, no-op
 * performance impact. Server-side render boyutu sifir (return null).
 */
export function HeroVariantReporter({ variant }: HeroVariantReporterProps) {
  useEffect(() => {
    try {
      Sentry.getCurrentScope().setTag("hero_variant", variant);
      Sentry.addBreadcrumb({
        category: "experiment",
        message: `hero_variant=${variant}`,
        level: "info",
      });
    } catch {
      // Sentry olmayan build/dev'de sessiz gec.
    }
  }, [variant]);

  return null;
}
