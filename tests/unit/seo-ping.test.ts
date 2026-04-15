/**
 * Unit tests for sitemap ping URL construction + report formatter.
 * Network-touching `pingSitemap` has its own manual smoke test (run
 * `npm run content:ping` and eyeball the output); everything below is
 * pure logic we can lock down in CI.
 */
import { describe, it, expect } from "vitest";
import {
  buildPingUrl,
  formatPingReport,
  type PingResult,
} from "../../src/lib/seo-ping";

describe("buildPingUrl()", () => {
  it("Google ping endpoint", () => {
    const url = buildPingUrl(
      "google",
      "https://tarifle.app/sitemap.xml",
    );
    expect(url).toBe(
      "https://www.google.com/ping?sitemap=https%3A%2F%2Ftarifle.app%2Fsitemap.xml",
    );
  });

  it("Bing ping endpoint", () => {
    const url = buildPingUrl(
      "bing",
      "https://tarifle.app/sitemap.xml",
    );
    expect(url).toBe(
      "https://www.bing.com/ping?sitemap=https%3A%2F%2Ftarifle.app%2Fsitemap.xml",
    );
  });

  it("sitemap URL query-encoded (özel karakterler güvenli)", () => {
    const url = buildPingUrl("google", "https://example.com/sitemap.xml?v=1");
    expect(url).toContain("sitemap=https%3A%2F%2Fexample.com%2Fsitemap.xml%3Fv%3D1");
  });
});

describe("formatPingReport()", () => {
  it("başarılı ping'leri ✅ + HTTP kodu ile gösterir", () => {
    const results: PingResult[] = [
      {
        engine: "google",
        url: "https://www.google.com/ping?sitemap=...",
        status: "ok",
        httpCode: 200,
      },
    ];
    expect(formatPingReport(results)).toContain("✅ google  HTTP 200");
  });

  it("başarısız ping'leri ⚠ + hata mesajı ile gösterir", () => {
    const results: PingResult[] = [
      {
        engine: "bing",
        url: "https://www.bing.com/ping?sitemap=...",
        status: "failed",
        error: "ECONNREFUSED",
      },
    ];
    expect(formatPingReport(results)).toContain("⚠ bing");
    expect(formatPingReport(results)).toContain("ECONNREFUSED");
  });

  it("iki engine sonucunu alt alta basar", () => {
    const results: PingResult[] = [
      { engine: "google", url: "x", status: "ok", httpCode: 200 },
      { engine: "bing", url: "y", status: "failed", error: "timeout" },
    ];
    const out = formatPingReport(results);
    expect(out.split("\n")).toHaveLength(2);
    expect(out).toContain("google");
    expect(out).toContain("bing");
  });

  it("boş array → boş string", () => {
    expect(formatPingReport([])).toBe("");
  });
});
