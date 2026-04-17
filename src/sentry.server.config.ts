/**
 * Sentry server-side (Node.js runtime) config. RSC render hatalar,
 * server action exception'lar, API route 500'ler buradan yakalanır.
 *
 * En kritik Tarifle senaryosu: authorize() patladığında (ör. schema
 * mismatch) Sentry alarmı — 17 Nis 2026 gibi bir outage 1 dakikada
 * görülür.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Prisma/Auth.js internal errors çoğu zaman normal akışın parçası.
    // Raw Error mesajlarını analiz ederken ihtiyaç duyulursa açılır.
    ignoreErrors: [
      "Invariant: Method expects to have requestAsyncStorage",
      /NEXT_REDIRECT/,
      /NEXT_NOT_FOUND/,
    ],
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  });
}
