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
          // Auth-gated social features, crawler yok, indeks değerinde
          // değiller; thin/protected content'in crawl bütçesini yemesin.
          "/akis",
          "/akis/*",
          "/menu-planlayici",
          "/menu-planlayici/*",
          // Query-string filtre kombinasyonları crawl trap. /tarifler?q=,
          // ?kategori=, ?mutfak= vs. noindex meta zaten bunları dışında
          // tutuyor ama crawl bütçesi için Disallow + Google'ın URL
          // parametre öğrenme süresi azaltılıyor. Path-based canonical
          // (/tarifler/[kategori], /mutfak/[cuisine]) indexable kalır.
          "/tarifler?*",
          // Pagination crawl trap (page>1 noindex + canonical page 1,
          // yine de Google sık sık para variant çekiyor).
          "/*?sayfa=*",
          "/*?page=*",
          // Share-URL variant'ları (UTM, FB click id, vs), canonical
          // zaten clean URL'e gidiyor ama yine de crawler'a söyle.
          "/*?utm_*",
          "/*?fbclid=*",
          "/*?gclid=*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
