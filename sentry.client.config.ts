/**
 * Sentry client-side config. Tarifle'de runtime JS hataları bu SDK
 * üzerinden yakalanır ve Sentry'ye iletilir.
 *
 * DSN env var yoksa (ör. lokal dev, CI) Sentry sessizce devre dışı
 * kalır — init() no-op gibi davranır. Vercel Production env'e
 * NEXT_PUBLIC_SENTRY_DSN ekleyince otomatik aktifleşir.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Traces: prod'da %10 sample, dev'de %100 — production trafikte
    // maliyet-dengeli, local debug için tam.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Session Replay yalnız hata olduğunda (%100 error session), normal
    // session sampling kapalı — privacy + quota.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    // Bilinen gürültü: Next.js router cancel, user cancel, extension noise.
    ignoreErrors: [
      "Non-Error promise rejection captured",
      "ResizeObserver loop limit exceeded",
      /NEXT_REDIRECT/,
      /NEXT_NOT_FOUND/,
      /top\.GLOBALS/, // rare extension polyfill
    ],
    // Prod release identifier — Vercel sha'yı env'e atar.
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  });
}
