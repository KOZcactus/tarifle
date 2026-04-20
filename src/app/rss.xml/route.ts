/**
 * RSS 2.0 feed handler, `/rss.xml` route. Son 50 PUBLISHED tarifi
 * yayınlar; feed reader'lar (Feedly, Inoreader, NetNewsWire) ve
 * Google Feed crawler abone olabilir.
 *
 * Neden 50: 706+ tarif ölçeğinde 30 tarif son 3 batch'i bile kapsamıyor.
 * 50, Codex'in bir batch'ini (100) tam kaplamaz ama son 2-3 haftanın
 * yeni içeriğini gösterir. Feed reader'lar tipik olarak ilk fetch'te
 * hepsini yükler, sonrası delta.
 *
 * Cache: hourly revalidate (sitemap ile uyumlu). Her batch sonrası
 * seed + retrofit + sitemap ping pipeline'ında RSS de otomatik güncel
 * olur, ekstra ping yok (feed reader'lar periyodik poll eder).
 */
import { prisma } from "@/lib/prisma";
import { buildRssXml, type RssItem } from "@/lib/rss";

// Build-time prerender'ı kapatıyoruz çünkü CI'da DATABASE_URL placeholder
// (`postgresql://ci:ci@localhost:5432/ci`), Prisma bağlantı kuramaz,
// build düşer. force-dynamic ile her istek runtime'da render edilir;
// `Cache-Control: s-maxage=3600` sayesinde CDN (Vercel/Cloudflare)
// 1 saatlik cache sağlar, perf etkisi sıfır. ISR semantiği yerine
// CDN cache'i.
//
// sitemap.ts'in default convention'ı bu şekilde ele alınmıyor,
// Next.js convention dosyaları (sitemap, robots) farklı path'ten geçiyor;
// custom route handler için manuel beyan gerekiyor.
export const dynamic = "force-dynamic";
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
    take: 50,
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
