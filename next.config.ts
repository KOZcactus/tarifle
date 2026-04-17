import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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

// Sentry wrapper — source maps upload + auto-instrumentation. DSN yoksa
// build time'da uyarı verir ama fail etmez. SENTRY_AUTH_TOKEN prod'da
// Vercel env'e konulunca source map upload çalışır.
export default withSentryConfig(nextConfig, {
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
  // Source map config — prod JS içinde source map path'i gömülmez ama
  // Sentry sunucusunda erişilebilir.
  sourcemaps: {
    disable: false,
  },
});
