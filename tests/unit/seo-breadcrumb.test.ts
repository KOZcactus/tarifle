/**
 * Unit tests for the BreadcrumbList JSON-LD generator. Breadcrumb
 * markup is what Google uses to render "Ana Sayfa › Tarifler ›
 * Category › Recipe" strips under search results, getting the schema
 * shape right matters for rich results eligibility.
 */
import { describe, it, expect } from "vitest";
import { generateBreadcrumbJsonLd } from "../../src/lib/seo";

describe("generateBreadcrumbJsonLd()", () => {
  it("Schema.org BreadcrumbList type + context döndürür", () => {
    const out = generateBreadcrumbJsonLd([
      { name: "Ana Sayfa", url: "/" },
      { name: "Tarifler", url: "/tarifler" },
    ]);
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@type"]).toBe("BreadcrumbList");
  });

  it("her item ListItem + 1-tabanlı position alır", () => {
    const out = generateBreadcrumbJsonLd([
      { name: "A", url: "/a" },
      { name: "B", url: "/b" },
      { name: "C", url: "/c" },
    ]);
    expect(out.itemListElement).toHaveLength(3);
    expect(out.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      name: "A",
    });
    expect(out.itemListElement[2]).toMatchObject({ position: 3, name: "C" });
  });

  it("relative URL'leri SITE_URL ile prefix'ler", () => {
    const out = generateBreadcrumbJsonLd([{ name: "Tarifler", url: "/tarifler" }]);
    expect(out.itemListElement[0]?.item).toBe("https://tarifle.app/tarifler");
  });

  it("absolute URL'leri olduğu gibi bırakır", () => {
    const out = generateBreadcrumbJsonLd([
      { name: "External", url: "https://example.com/foo" },
    ]);
    expect(out.itemListElement[0]?.item).toBe("https://example.com/foo");
  });

  it("boş array → boş itemListElement", () => {
    const out = generateBreadcrumbJsonLd([]);
    expect(out.itemListElement).toEqual([]);
  });

  it("tam tarif breadcrumb senaryosu (4 seviye)", () => {
    const out = generateBreadcrumbJsonLd([
      { name: "Ana Sayfa", url: "/" },
      { name: "Tarifler", url: "/tarifler" },
      { name: "Et Yemekleri", url: "/tarifler?kategori=et-yemekleri" },
      { name: "Adana Kebap", url: "/tarif/adana-kebap" },
    ]);
    expect(out.itemListElement).toHaveLength(4);
    expect(out.itemListElement[3]).toMatchObject({
      position: 4,
      name: "Adana Kebap",
      item: "https://tarifle.app/tarif/adana-kebap",
    });
  });
});
