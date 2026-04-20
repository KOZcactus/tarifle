/**
 * Unit tests for the RSS 2.0 XML generator. Route handler itself hits
 * the DB and is covered by manual smoke test (curl /rss.xml); the pure
 * XML builder is where escape bugs + format drift would land, so we
 * lock it down here.
 */
import { describe, it, expect } from "vitest";
import {
  escapeXml,
  toRssDate,
  buildRssXml,
  type RssItem,
} from "../../src/lib/rss";

describe("escapeXml()", () => {
  it("XML özel karakterlerini entity'ye çevirir", () => {
    expect(escapeXml("foo & bar")).toBe("foo &amp; bar");
    expect(escapeXml("<tag>")).toBe("&lt;tag&gt;");
    expect(escapeXml('say "hi"')).toBe("say &quot;hi&quot;");
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("hepsini aynı anda işler", () => {
    expect(escapeXml(`<"A&B'C">`)).toBe(
      "&lt;&quot;A&amp;B&apos;C&quot;&gt;",
    );
  });

  it("TR karakterlerini korur (XML 1.0 içinde geçerli)", () => {
    expect(escapeXml("Şerbet & Güllaç")).toBe("Şerbet &amp; Güllaç");
    expect(escapeXml("İskender")).toBe("İskender");
  });

  it("boş string sorunsuz", () => {
    expect(escapeXml("")).toBe("");
  });
});

describe("toRssDate()", () => {
  it("RFC 822 formatında döner", () => {
    const d = new Date("2026-04-15T14:00:00Z");
    expect(toRssDate(d)).toBe("Wed, 15 Apr 2026 14:00:00 GMT");
  });
});

describe("buildRssXml()", () => {
  const sampleItem: RssItem = {
    title: "Adana Kebap",
    slug: "adana-kebap",
    description: "Acılı kıyma kebabı, Adana yöresinden.",
    pubDate: new Date("2026-04-15T12:00:00Z"),
    category: "Et Yemekleri",
  };

  it("XML declaration + RSS 2.0 envelope içerir", () => {
    const xml = buildRssXml([sampleItem]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("</rss>");
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
  });

  it("channel metadata'sı default'tan geliyor (SITE_NAME vb.)", () => {
    const xml = buildRssXml([]);
    expect(xml).toContain("<title>Tarifle</title>");
    expect(xml).toContain("<link>https://tarifle.app</link>");
    expect(xml).toContain("<language>tr-TR</language>");
  });

  it("atom:link self-reference mevcut (Feed Validator zorunlu)", () => {
    const xml = buildRssXml([]);
    expect(xml).toContain(
      '<atom:link href="https://tarifle.app/rss.xml" rel="self" type="application/rss+xml" />',
    );
  });

  it("item alanları doğru render eder + link item URL'ine işaret", () => {
    const xml = buildRssXml([sampleItem]);
    expect(xml).toContain("<title>Adana Kebap</title>");
    expect(xml).toContain("<link>https://tarifle.app/tarif/adana-kebap</link>");
    expect(xml).toContain(
      '<guid isPermaLink="true">https://tarifle.app/tarif/adana-kebap</guid>',
    );
    expect(xml).toContain("<category>Et Yemekleri</category>");
    expect(xml).toContain("<pubDate>Wed, 15 Apr 2026 12:00:00 GMT</pubDate>");
  });

  it("kullanıcı içeriğindeki XML karakterlerini escape eder", () => {
    const item: RssItem = {
      title: 'Mantı <"Ev Usulü">',
      slug: "manti",
      description: "Börek & makarna karışımı",
      pubDate: new Date("2026-04-15T12:00:00Z"),
    };
    const xml = buildRssXml([item]);
    expect(xml).toContain(
      "<title>Mantı &lt;&quot;Ev Usulü&quot;&gt;</title>",
    );
    expect(xml).toContain(
      "<description>Börek &amp; makarna karışımı</description>",
    );
  });

  it("kategori opsiyonel, verilmediğinde <category> elementi yok", () => {
    const noCategory: RssItem = {
      title: "Deneme",
      slug: "deneme",
      description: "...",
      pubDate: new Date("2026-04-15T12:00:00Z"),
    };
    const xml = buildRssXml([noCategory]);
    expect(xml).not.toContain("<category>");
  });

  it("30 item'e kadar ölçeklenir (regression cap)", () => {
    const many: RssItem[] = Array.from({ length: 30 }, (_, i) => ({
      title: `Tarif ${i}`,
      slug: `tarif-${i}`,
      description: `Açıklama ${i}`,
      pubDate: new Date("2026-04-15T12:00:00Z"),
    }));
    const xml = buildRssXml(many);
    const itemMatches = xml.match(/<item>/g);
    expect(itemMatches).toHaveLength(30);
  });

  it("boş item listesi → channel render olur, item yok", () => {
    const xml = buildRssXml([]);
    expect(xml).not.toContain("<item>");
    expect(xml).toContain("<channel>");
  });
});
