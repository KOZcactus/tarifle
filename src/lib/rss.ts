/**
 * Pure RSS 2.0 XML generator. Extracted so `src/app/rss.xml/route.ts`
 * stays a thin handler and the XML structure can be unit-tested without
 * standing up a Next.js request context.
 *
 * RSS 2.0 spec: https://www.rssboard.org/rss-specification
 *
 * Why RSS (sitemap varken): sitemap.xml crawler'a "tüm URL listesi
 * burada" der; feed "son eklenenler burada, timestamp + özet ile" der.
 * Google Feed crawler ayrıca index ediyor, feed reader'lar (Feedly,
 * Inoreader, NetNewsWire) kullanıcıları abone yapabiliyor. Düşük
 * maliyet, kurarsak tekrar kurulmaz.
 */

import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export interface RssItem {
  title: string;
  slug: string;
  description: string;
  pubDate: Date;
  category?: string;
}

export interface RssChannelMeta {
  title: string;
  description: string;
  link: string;
  lastBuildDate: Date;
  language: string;
}

/**
 * XML özel karakterlerini entity'lere dönüştürür. RSS item alanları
 * kullanıcı-turevli (tarif başlığı, description) değerler taşır, bu
 * yüzden escape zorunlu. Bu set XML 1.0 minimum gereklilikleri —
 * CDATA wrapping alternatifi de var ama tek-seferlik replace daha
 * okunur çıktı üretir.
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * `Date` → RFC 822 format (RSS spec zorunlu). `toUTCString` bunu verir;
 * "Tue, 15 Apr 2026 14:00:00 GMT" tarzı.
 */
export function toRssDate(d: Date): string {
  return d.toUTCString();
}

function renderItem(item: RssItem): string {
  const url = `${SITE_URL}/tarif/${item.slug}`;
  const parts = [
    `  <item>`,
    `    <title>${escapeXml(item.title)}</title>`,
    `    <link>${escapeXml(url)}</link>`,
    `    <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `    <description>${escapeXml(item.description)}</description>`,
    `    <pubDate>${toRssDate(item.pubDate)}</pubDate>`,
  ];
  if (item.category) {
    parts.push(`    <category>${escapeXml(item.category)}</category>`);
  }
  parts.push(`  </item>`);
  return parts.join("\n");
}

export function buildRssXml(
  items: readonly RssItem[],
  channel: RssChannelMeta = {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    link: SITE_URL,
    lastBuildDate: new Date(),
    language: "tr-TR",
  },
): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>`;
  const feedUrl = `${channel.link}/rss.xml`;
  const channelHeader = [
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `<channel>`,
    `  <title>${escapeXml(channel.title)}</title>`,
    `  <link>${escapeXml(channel.link)}</link>`,
    `  <description>${escapeXml(channel.description)}</description>`,
    `  <language>${escapeXml(channel.language)}</language>`,
    `  <lastBuildDate>${toRssDate(channel.lastBuildDate)}</lastBuildDate>`,
    // atom:link self-reference — feed reader'lara "bu kanalın canonical
    // URL'i" der. RSS 2.0 best practice (Feed Validator uyarı basar yoksa).
    `  <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
  ];

  const rendered = items.map(renderItem);

  const footer = [`</channel>`, `</rss>`];

  return [header, ...channelHeader, ...rendered, ...footer].join("\n");
}
