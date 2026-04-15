/**
 * RSS 2.0 feed handler — `/rss.xml` route. Son 30 PUBLISHED tarifi
 * yayınlar; feed reader'lar (Feedly, Inoreader, NetNewsWire) ve
 * Google Feed crawler abone olabilir.
 *
 * Neden 30: RSS default / expected size. Feed reader'lar tipik olarak
 * ilk fetch'te hepsini yükler, sonrası delta. Çok büyük feed'ler
 * (200+) crawler'ları yorar ve tarihsiz öğeler eski sırada gelirse
 * kullanıcı yeni tarifleri kolay bulamaz.
 *
 * Cache: hourly revalidate (sitemap ile uyumlu). Her batch sonrası
 * seed + retrofit + sitemap ping pipeline'ında RSS de otomatik güncel
 * olur — ekstra ping yok (feed reader'lar periyodik poll eder).
 */
import { prisma } from "@/lib/prisma";
import { buildRssXml, type RssItem } from "@/lib/rss";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      title: true,
      slug: true,
      description: true,
      createdAt: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const items: RssItem[] = recipes.map((r) => ({
    title: r.title,
    slug: r.slug,
    description: r.description,
    pubDate: r.createdAt,
    category: r.category.name,
  }));

  const xml = buildRssXml(items);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Feed reader'lar bu header'ı görünce CDN cache'i 1 saat baz alır.
      // Next.js `revalidate` zaten ISR için çalışıyor; `Cache-Control`
      // client/CDN side için explicit sinyal.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
