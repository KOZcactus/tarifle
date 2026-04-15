/**
 * robots.txt for search engine crawlers. Next.js reads this file
 * convention and serves at `/robots.txt`.
 *
 * Policy:
 *   - Allow all user-agents on public pages
 *   - Disallow /admin, /ayarlar (auth-gated anyway, but explicit is clearer)
 *   - Disallow /api (internal, no SEO value)
 *   - Disallow /bildirimler (user-specific, gated)
 *   - Link the sitemap so crawlers find all recipe URLs efficiently
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/ayarlar",
          "/api/*",
          "/bildirimler",
          "/dogrula/*",
          "/sifre-sifirla/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
