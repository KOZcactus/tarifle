import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

/**
 * RSS 2.0 feed, son 50 PUBLISHED tarif. URL: `/feed.xml`.
 *
 * Neden RSS 2.0 (Atom değil): tarif platformları için RSS reader desteği
 * daha geniş (Feedly, Inoreader, vb.) ve Google Search Console bu formatı
 * sitemaps'in yanında "yeni içerik discovery" sinyali olarak okur. Atom
 * daha modern ama content-oriented ekosistemde RSS hâlâ default.
 *
 * Kategorize alan: item'da tek `<category>` per recipe (ana kategori
 * adı). Multiple category bazı reader'larda duplicate listeleme yapıyor.
 *
 * Cache: `force-dynamic` + revalidate 1h. Yeni tarif seed'lenince
 * bir sonraki crawl'da görünür. Cold ~30ms (Neon eu-west cold-start
 * dahil).
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      emoji: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const now = new Date().toUTCString();
  const lastBuildDate = recipes[0]
    ? new Date(recipes[0].updatedAt).toUTCString()
    : now;

  const items = recipes
    .map((r) => {
      const link = `${SITE_URL}/tarif/${r.slug}`;
      const title = `${r.emoji ?? "🍽️"} ${r.title}`;
      const pubDate = new Date(r.createdAt).toUTCString();
      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(r.description)}</description>
      <category>${escapeXml(r.category.name)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}, Yeni Tarifler</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(
      "Tarifle platformundaki en yeni yemek, içecek ve kokteyl tarifleri. Günlük güncellenir.",
    )}</description>
    <language>tr-TR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Tarifle RSS (Next.js App Router)</generator>
    <ttl>60</ttl>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
