import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl plugin, `src/i18n/request.ts` config'ini keşfeder, her RSC
// render'ında getRequestConfig() çağrılır, locale + messages enjekte
// edilir. Cookie-based pattern (URL routing yok) ile uyumlu.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Not (oturum 12): Next 16 `cacheComponents` denendi (Partial
  // Prerendering yeni API). Tarifle'de 30+ dosyada `export const dynamic
  // = "force-dynamic"` + `export const revalidate` var (admin routes,
  // cron, API export, kesfet, menu-planlayici vs). cacheComponents tum
  // bu dynamic marker'lari yasaklar; paradigm shift buyuk refactor
  // gerektirir (4-6 saatten fazla, tum app cache model'i revize).
  // Rollback edildi; mevcut unstable_cache TTL artislari + Suspense
  // streaming yeterli kazanc saglayacak (oturum 12 perf commit).
  // PDF route `@fontsource/roboto` local woff dosyalarını runtime'da
  // `fs` ile okuyor. Vercel serverless bundle default tracing bu dosyaları
  // göremez, bu yüzden explicit include. Cold start'ta network fetch
  // yok, glyph missing yok, Türkçe karakterler PDF'te doğru çizilir.
  outputFileTracingIncludes: {
    "/tarif/[slug]/pdf": [
      "./node_modules/@fontsource/roboto/files/roboto-latin-ext-*-normal.woff",
    ],
  },
  // 301 redirects, eski legal URL'leri yeni /yasal/* hub'ı altına yönlendir.
  // Permanent redirect (308 ≈ 301) ile SEO otoritesi korunur, external link'ler
  // bozulmaz. Next, `permanent: true` için 308 döner (method-preserving),
  // legacy 301 bekleyen crawler'lar da 308'i aynı şekilde işler.
  //
  // Canonical domain: www.tarifle.app -> tarifle.app (apex). İki domain
  // ayrı ayrı 200 serve ediyordu, Google duplicate content + split link
  // authority olarak okuyordu (GPT audit'i de "www vs apex karışımı" olarak
  // flag'lemişti). `has` host match ile www request'leri apex'e permanent
  // yönlendiriliyor; `SITE_URL` zaten apex, sitemap + canonical tag'ler
  // de apex, tam hizalama.
  redirects: async () => [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.tarifle.app" }],
      destination: "https://tarifle.app/:path*",
      permanent: true,
    },
    { source: "/kvkk", destination: "/yasal/kvkk", permanent: true },
    {
      source: "/kullanim-sartlari",
      destination: "/yasal/kullanim-kosullari",
      permanent: true,
    },
    { source: "/gizlilik", destination: "/yasal/gizlilik", permanent: true },
  ],
  // bf-cache: allow browsers to cache pages for back/forward navigation.
  // NextAuth's Set-Cookie still prevents full bfcache on dynamic pages,
  // but static assets and prefetch responses benefit. BfCacheRestore
  // component handles stale-session refresh client-side.
  headers: async () => [
    {
      source: "/((?!api|_next).*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

// Sentry wrapper, source maps upload + auto-instrumentation. DSN yoksa
// build time'da uyarı verir ama fail etmez. SENTRY_AUTH_TOKEN prod'da
// Vercel env'e konulunca source map upload çalışır.
export default withSentryConfig(withNextIntl(nextConfig), {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Tunnel route → Sentry istekleri aynı origin üzerinden geçer.
  // `/monitoring` default adı EasyPrivacy/AdGuard filter listelerinde
  // (ERR_BLOCKED_BY_CLIENT). `/api/*` altında obscure bir ad kullan →
  // hem ad-blocker listelerine yakalanmaz hem next.config headers
  // policy'sinden muaf (`/((?!api|_next).*)`).
  tunnelRoute: "/api/tarifle-ingest",
  // Source map config, prod JS içinde source map path'i gömülmez ama
  // Sentry sunucusunda erişilebilir.
  sourcemaps: {
    disable: false,
  },
});
