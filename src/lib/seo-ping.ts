/**
 * Sitemap ping helper — Codex batch seed veya retrofit sonrası Google
 * ve Bing crawler'larına "sitemap güncellendi, yeniden oku" sinyali atar.
 *
 * Neden manual seed sonrası: ana pipeline `seed → retrofit → (bu helper)`
 * şeklinde. Vercel deploy kod değişikliğinde otomatik tetikleniyor ama
 * seed script kod değiştirmeden sadece DB'ye tarif yazıyor — bu yüzden
 * Vercel'e bağlı otomatik trigger yok; bu script boşluğu doldurur.
 *
 * Crawler'lar her çağrıyı kuyruğa alır, hemen crawl garantisi yok ama
 * manuel beklemekten çok daha hızlı (saatler yerine dakikalar).
 *
 * Best-effort: ping başarısız olsa da seed script'in exit kodu etkilenmez
 * — crawl gecikmesi kritik değil. Log ama throw etme.
 */
import { SITE_URL } from "@/lib/constants";

export interface PingResult {
  engine: "google" | "bing";
  url: string;
  status: "ok" | "failed";
  httpCode?: number;
  error?: string;
}

/**
 * Saf URL oluşturma helper — unit test bunu kullanarak query-string
 * doğru mu, encode edilmiş mi onu doğruluyor. Network çağrısı yok.
 */
export function buildPingUrl(
  engine: "google" | "bing",
  sitemapUrl: string,
): string {
  const base =
    engine === "google"
      ? "https://www.google.com/ping"
      : "https://www.bing.com/ping";
  const params = new URLSearchParams({ sitemap: sitemapUrl });
  return `${base}?${params.toString()}`;
}

/**
 * İki arama motoruna paralel ping at. `timeoutMs` each — 5sn default
 * çünkü ping endpoint'leri genelde <2sn döner; daha uzun beklemek
 * seed script'in shutdown'ını gereksiz geciktirir.
 */
export async function pingSitemap(
  sitemapUrl: string = `${SITE_URL}/sitemap.xml`,
  timeoutMs = 5000,
): Promise<PingResult[]> {
  const engines: readonly ("google" | "bing")[] = ["google", "bing"];

  return Promise.all(
    engines.map(async (engine): Promise<PingResult> => {
      const url = buildPingUrl(engine, sitemapUrl);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "tarifle-sitemap-ping/1.0 (+https://tarifle.app)",
          },
        });
        clearTimeout(timer);
        return {
          engine,
          url,
          status: res.ok ? "ok" : "failed",
          httpCode: res.status,
        };
      } catch (err: unknown) {
        clearTimeout(timer);
        return {
          engine,
          url,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );
}

/**
 * Ping sonuçlarını insan-okunur satırlar halinde basar. Script son
 * çıktısına uygun format.
 */
export function formatPingReport(results: readonly PingResult[]): string {
  return results
    .map((r) => {
      const icon = r.status === "ok" ? "✅" : "⚠";
      const detail =
        r.status === "ok"
          ? `HTTP ${r.httpCode ?? "?"}`
          : r.error ?? `HTTP ${r.httpCode ?? "?"}`;
      return `  ${icon} ${r.engine.padEnd(7)} ${detail}`;
    })
    .join("\n");
}
