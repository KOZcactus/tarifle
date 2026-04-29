/**
 * Content-Security-Policy Report-Only endpoint.
 *
 * next.config.ts'teki `Content-Security-Policy-Report-Only` header `report-uri`
 * directive bu endpoint'e violation JSON body POST'lar. Body yapısı:
 * {
 *   "csp-report": {
 *     "document-uri": "https://tarifle.app/...",
 *     "violated-directive": "script-src",
 *     "blocked-uri": "https://...",
 *     "effective-directive": "...",
 *     "original-policy": "...",
 *     ...
 *   }
 * }
 *
 * Bu endpoint violation'ı Sentry'ye breadcrumb + message olarak gönderir,
 * aynı zamanda console'a yazar (Vercel function logs). 1-2 hafta report
 * toplandıktan sonra enforce geçişi: `Content-Security-Policy` header'ı
 * aktif edilir, Report-Only kaldırılır.
 *
 * Rate-limited: CSP violation flood saldırısına karşı (browser-side değil
 * ama bot veya misconfigured extension flood edebilir). IP bazlı 60/dk.
 */

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Violation JSON tipi (W3C CSP Level 2 spec)
interface CspViolationReport {
  "csp-report"?: {
    "document-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "blocked-uri"?: string;
    "original-policy"?: string;
    "source-file"?: string;
    "line-number"?: number;
    "column-number"?: number;
    "status-code"?: number;
    "script-sample"?: string;
  };
}

/**
 * Browser-induced CSP noise prefix listesi. Kullanıcının tarayıcısı veya
 * eklentileri kendi başına enjekte ettikleri ve bizim app kodumuzla ilgisi
 * olmayan kaynaklar. Sentry'ye forward edilmez (signal kirletmesin) ama
 * yine de console.warn ile loglanır.
 *
 * Eklenen pattern'ler:
 * - translate.google.com / translate.googleapis.com / translate-pa.googleapis.com:
 *   Chrome / Android WebView "sayfayı çevir" özelliği. Sayfayı çevirirken
 *   Translate widget'ı kendi telemetry/beacon çağrılarını yapar
 *   (connect-src + img-src violation). Bizim app çevirmiyor; user-induced.
 *   (oturum 33, 28-29 Nis 2026 prod alarmları sonrası filtrelendi)
 * - chrome-extension://, moz-extension://, safari-extension://: kullanıcı
 *   tarayıcı eklentilerinin enjekte ettiği script/img/connect kaynakları.
 *   Bizim kontrolümüzde değil.
 * - webkit-masked-url://: Safari'nin gizli URL maskeleme şeması.
 */
const BROWSER_NOISE_PREFIXES = [
  "https://translate.google.com",
  "https://translate.googleapis.com",
  "https://translate-pa.googleapis.com",
  "chrome-extension://",
  "moz-extension://",
  "safari-extension://",
  "safari-web-extension://",
  "webkit-masked-url://",
];

function isBrowserNoise(blockedUri: string | undefined): boolean {
  if (!blockedUri) return false;
  return BROWSER_NOISE_PREFIXES.some((p) => blockedUri.startsWith(p));
}

export async function POST(request: Request): Promise<NextResponse> {
  // Rate limit by IP (vercel `x-forwarded-for` ilk IP veya fallback)
  const fwd = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = fwd.split(",")[0]?.trim() ?? "unknown";
  const rate = await checkRateLimit("csp-report", ip);
  if (!rate.success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: CspViolationReport | undefined;
  try {
    body = (await request.json()) as CspViolationReport;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const report = body?.["csp-report"];
  if (!report) {
    return NextResponse.json({ ok: false, error: "missing-csp-report" }, { status: 400 });
  }

  // Özet log: violation ana noktaları
  const summary = {
    document: report["document-uri"],
    directive: report["effective-directive"] ?? report["violated-directive"],
    blocked: report["blocked-uri"],
    sourceFile: report["source-file"],
    line: report["line-number"],
  };
  console.warn("[csp-report]", JSON.stringify(summary));

  // Browser-induced gürültüyü Sentry'ye forward etme. Bizim app kodumuzdan
  // gelmeyen, kullanıcının tarayıcı/eklenti davranışından kaynaklanan
  // violation'lar (Google Translate auto-translate, browser extensions vs.)
  // signal kirletir; Sentry alert quota'sı + dikkat dağıtır.
  if (isBrowserNoise(report["blocked-uri"])) {
    return new NextResponse(null, { status: 204 });
  }

  // Sentry'ye message + context (Report-Only toplama aşamasında issue grouping)
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    scope.setTag("csp.directive", report["effective-directive"] ?? "unknown");
    scope.setTag("csp.blocked_uri", report["blocked-uri"] ?? "unknown");
    scope.setContext("csp-violation", {
      documentUri: report["document-uri"],
      violatedDirective: report["violated-directive"],
      effectiveDirective: report["effective-directive"],
      blockedUri: report["blocked-uri"],
      sourceFile: report["source-file"],
      lineNumber: report["line-number"],
      columnNumber: report["column-number"],
      scriptSample: report["script-sample"],
    });
    Sentry.captureMessage(
      `CSP violation: ${report["effective-directive"] ?? "unknown"} blocked ${report["blocked-uri"] ?? "unknown"}`,
      "warning",
    );
  });

  // 204 No Content with NO body, illegal HTTP olur eger body yazarsak
  // (NextResponse.json bunu yapiyordu, 500 ile sonuclaniyordu - oturum 19
  // smoke test ile yakalandi). Standart CSP report endpoint pattern: 204.
  return new NextResponse(null, { status: 204 });
}

// Tarayicilar `Content-Type: application/csp-report` ile POST eder; Next.js
// JSON parser bu tipi varsayilan olarak kabul etmez ama request.json() tipten
// bagimsiz yine de body'yi parse eder (body stream JSON gecerli).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
