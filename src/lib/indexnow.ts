/**
 * IndexNow helper, Bing / Yandex / Seznam / Naver'a tek API ile
 * batch URL ping'i.
 *
 * Protokol: https://www.indexnow.org/documentation
 * Spec: POST https://api.indexnow.org/indexnow
 *   { host, key, keyLocation, urlList: [...] }
 *
 * Limit: tek istek başına 10 000 URL. Günlük limit yok (makul kullanım).
 * Google IndexNow'u desteklemez (Search Console ayrı kalır) ama arka kanal
 * değerinde: Bing index'e düştükten sonra Google da bot yönlendirebilir.
 *
 * Doğrulama: site kökünde `/{key}.txt` erişilebilir olmalı. Biz bunu
 * Next.js dynamic route ile serve ediyoruz, statik dosya değil, env
 * değeri ile eşleşen isteklere cevap veriyor (rotate kolay).
 *
 * Env:
 *   INDEXNOW_KEY, 32-char lowercase hex. Kerem Vercel'e ekleyince aktif
 *                  olur; env set değilse `pingIndexNow` no-op döner.
 *   NEXT_PUBLIC_SITE_URL, "https://tarifle.app" (default).
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;

export interface IndexNowResult {
  ok: boolean;
  status: number;
  submitted: number;
  skipped?: number;
  reason?: string;
}

/** Resmi: key sadece 8-128 karakter, [0-9a-zA-Z-] aralığında. */
export function isValidKey(key: string | undefined | null): key is string {
  if (!key) return false;
  return /^[a-zA-Z0-9-]{8,128}$/.test(key);
}

/** Site base URL, env yoksa canlı prod. */
export function getSiteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://tarifle.app";
}

/** URL validasyonu, host eşleşmesi + http(s) şart. */
export function filterValidUrls(urls: string[], baseUrl: string): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      if (u.host !== base.host) continue;
      const canonical = u.toString();
      if (!seen.has(canonical)) {
        seen.add(canonical);
        out.push(canonical);
      }
    } catch {
      // skip malformed
    }
  }
  return out;
}

/**
 * IndexNow'a batch ping atar. URL'ler host'a uymazsa atlanır; >10 000
 * URL gelirse 10k'lık parça parça gönderir.
 *
 * Başarı kriteri: HTTP 200 veya 202. 422 "unknown URL" genelde tek seferlik,
 * önemli değil; 403/404 key doğrulaması problemi demek.
 */
export async function pingIndexNow(
  urls: string[],
  opts: { key?: string; baseUrl?: string; host?: string } = {},
): Promise<IndexNowResult> {
  const key = opts.key ?? process.env.INDEXNOW_KEY;
  if (!isValidKey(key)) {
    return {
      ok: false,
      status: 0,
      submitted: 0,
      reason: "INDEXNOW_KEY env yok veya invalid (8-128 char [a-zA-Z0-9-])",
    };
  }

  const baseUrl = opts.baseUrl ?? getSiteBaseUrl();
  const parsed = new URL(baseUrl);
  const host = opts.host ?? parsed.host;
  const keyLocation = `${baseUrl.replace(/\/$/, "")}/${key}.txt`;

  const filtered = filterValidUrls(urls, baseUrl);
  if (filtered.length === 0) {
    return {
      ok: false,
      status: 0,
      submitted: 0,
      skipped: urls.length,
      reason: "No valid URLs after filtering (host mismatch veya malformed)",
    };
  }

  let submitted = 0;
  let lastStatus = 0;
  for (let i = 0; i < filtered.length; i += MAX_URLS_PER_REQUEST) {
    const chunk = filtered.slice(i, i + MAX_URLS_PER_REQUEST);
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Host: "api.indexnow.org",
      },
      body: JSON.stringify({ host, key, keyLocation, urlList: chunk }),
    });
    lastStatus = res.status;
    if (res.status === 200 || res.status === 202) {
      submitted += chunk.length;
    } else {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        submitted,
        skipped: filtered.length - submitted,
        reason: `IndexNow ${res.status}: ${text.slice(0, 200)}`,
      };
    }
  }

  return {
    ok: true,
    status: lastStatus,
    submitted,
    skipped: urls.length - submitted,
  };
}
