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
    // Dev environment'ta tracesSampleRate 0 (oturum 25 GPT audit):
    // localhost'ta N+1 Query + Slow DB Query gibi performance issue
    // alarmlari spam ediyordu (mutfak/tunus, tarifler/aperatifler,
    // diyet/vegan vs.). Local DB fresh data + cache temiz; prod
    // gercegi yansitmiyor. Prod'da 0.1 sample ile gercek N+1 sinyali
    // korunur, dev'de sifir trace = sifir alarm.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
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
      // Dev environment double-guard: tracesSampleRate 0 ile transaction
      // hic uretilmemeli, ama runtime'da kacak olursa filter.
      if (process.env.NODE_ENV !== "production") {
        return null;
      }
      // Prod'da Prisma N+1 issue'lari belirli landing sayfalarinda
      // bilincli/cache'li (oturum 17 + oturum 25 genisletme): tarif
      // detay + 3 landing route. Sample %5 ile temsil yeterli.
      const N1_ROUTES = new Set([
        "/tarif/[slug]",
        "/tarifler/[kategori]",
        "/mutfak/[cuisine]",
        "/diyet/[diet]",
      ]);
      const spans = event.spans ?? [];
      const hasN1Issue = spans.some(
        (s) =>
          s.op === "db.query" &&
          s.description?.includes("prisma") &&
          N1_ROUTES.has(event.transaction ?? ""),
      );
      if (hasN1Issue && event.contexts?.trace?.op === "http.server") {
        if (Math.random() > 0.05) return null;
      }
      return event;
    },
  });
}
