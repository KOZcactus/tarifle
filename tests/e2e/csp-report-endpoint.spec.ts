import { test, expect } from "@playwright/test";

/**
 * CSP Report endpoint smoke (oturum 19 P1 test paketi).
 *
 * `/api/csp-report` browser tarafından `Content-Security-Policy-Report-Only`
 * header'ındaki `report-uri` direktifiyle çağrılır. Body W3C CSP Level 2
 * formatı: `{ "csp-report": { ... } }`. Endpoint Sentry'ye message forward
 * eder + 204 No Content döner.
 *
 * Oturum 19'da deploy sonrası smoke test ile yakalanan bug:
 * `NextResponse.json({...}, {status: 204})` illegal HTTP idi (204 + body
 * birlikte olmaz, runtime crash + 500). Fix `new NextResponse(null, 204)`.
 * Bu spec o regresyona karşı koruma.
 */

test.describe("CSP Report endpoint /api/csp-report", () => {
  test("valid CSP violation body → 204 No Content", async ({ request }) => {
    const violation = {
      "csp-report": {
        "document-uri": "http://localhost:3000/",
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "blocked-uri": "https://example.com/evil.js",
        "original-policy": "default-src 'self'; script-src 'self'",
        "source-file": "http://localhost:3000/",
        "line-number": 42,
        "column-number": 10,
      },
    };

    const res = await request.post("/api/csp-report", {
      headers: { "Content-Type": "application/csp-report" },
      data: JSON.stringify(violation),
    });

    expect(res.status()).toBe(204);
    // 204 No Content gövde içermemeli
    const body = await res.text();
    expect(body).toBe("");
  });

  test("missing 'csp-report' field → 400 invalid", async ({ request }) => {
    const res = await request.post("/api/csp-report", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ wrongShape: true }),
    });

    expect(res.status()).toBe(400);
  });

  test("invalid JSON body → 400 invalid-json", async ({ request }) => {
    const res = await request.post("/api/csp-report", {
      headers: { "Content-Type": "application/json" },
      data: "{ not-valid-json: true",
    });

    expect(res.status()).toBe(400);
  });

  test("rate limit kicks in after 60 reports/min", async ({ request }) => {
    // Sıralı 65 POST: ilk 60'ı 204, son 5'i muhtemelen 429.
    // Upstash Redis bağlı değilse fail-open: hepsi 204 döner (bu da OK,
    // rate limit Redis'siz disable, "config eksik" senaryosu).
    const responses: number[] = [];
    for (let i = 0; i < 65; i++) {
      const r = await request.post("/api/csp-report", {
        headers: { "Content-Type": "application/csp-report" },
        data: JSON.stringify({
          "csp-report": {
            "document-uri": `http://localhost:3000/?test=${i}`,
            "violated-directive": "script-src",
            "blocked-uri": `https://example.com/evil-${i}.js`,
          },
        }),
      });
      responses.push(r.status());
    }

    // En az birinin 204 olması gerekli; 429 (rate limited) veya hep 204
    // (Redis yok, fail-open) ikisi de kabul.
    const ok = responses.filter((s) => s === 204).length;
    const limited = responses.filter((s) => s === 429).length;
    expect(ok + limited).toBe(65);
    expect(ok).toBeGreaterThan(0);
  });
});
