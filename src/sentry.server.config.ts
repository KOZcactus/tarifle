/**
 * Sentry server-side (Node.js runtime) config. RSC render hatalar,
 * server action exception'lar, API route 500'ler buradan yakalanır.
 *
 * En kritik Tarifle senaryosu: authorize() patladığında (ör. schema
 * mismatch) Sentry alarmı, 17 Nis 2026 gibi bir outage 1 dakikada
 * görülür.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Session 11 noise tune: Prisma/Auth.js/Next.js internal "expected"
    // error'ları dashboard'u dolduruyor. Aşağıdakiler bilinen benign
    // pattern'ler, gerçek outage sinyalini bulandırmasın.
    ignoreErrors: [
      // Next.js internal flow control (not bug, intentional throw)
      "Invariant: Method expects to have requestAsyncStorage",
      /NEXT_REDIRECT/,
      /NEXT_NOT_FOUND/,
      // Request-scoped abort (client disconnect, navigation mid-flight).
      // Server tarafında da gelebiliyor; legitim outage değil.
      "AbortError",
      "The operation was aborted",
      "Request aborted",
      // Prisma connection transient (cold start + Neon pooler reconnect);
      // Tarifle Launch plan 5dk scale-to-zero yuzunden ilk istek bazen
      // P1001 gorur, retry sonra basarili. Persistent P1001 altyapi
      // outage sinyali (Neon uptime dashboard'dan izleniyor, Sentry'de
      // ekstra duplicate gerekmez).
      "Can't reach database server",
      "Timed out fetching a new connection",
      // Auth.js expected user-side
      "CredentialsSignin", // user yanlis sifre/email
      "AccessDenied", // email not verified, admin-only
      "AccountNotLinked", // OAuth email collision
      // Rate limit, expected throttle, her 429'u alarma donusturmek
      // spam. Monitor dashboardda count-aggregate izlenir.
      "Too Many Requests",
      "Rate limit exceeded",
      // JWT tampering / expired session, user cookie artifact
      "JWTExpired",
      "JWSSignatureVerificationFailed",
      "JWTSessionError",
    ],
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    // Oturum 17 noise tune: /tarif/[slug] için Sentry otomatik "N+1
    // Query" performans issue'ı üretiyordu. Mevcut query bilinçli
    // olarak nested select + unstable_cache 30 dk TTL ile çalışıyor
    // (getRecipeBySlug, lib/queries/recipe.ts satır 786). Googlebot
    // crawl spike'larında fresh cache miss dalgası tek seferlik
    // tetikler, gerçek bug değil. Cache invalidation stratejisi
    // monitor dashboard'da izleniyor; buradan duplicate alarm lazım
    // değil.
    beforeSendTransaction(event) {
      const spans = event.spans ?? [];
      const hasN1Issue = spans.some(
        (s) =>
          s.op === "db.query" &&
          s.description?.includes("prisma") &&
          event.transaction === "/tarif/[slug]",
      );
      if (hasN1Issue && event.contexts?.trace?.op === "http.server") {
        // Performance issue sadece sample'da görünsün, her trace
        // Sentry'ye gönderilmesin.
        if (Math.random() > 0.05) return null;
      }
      return event;
    },
  });
}
