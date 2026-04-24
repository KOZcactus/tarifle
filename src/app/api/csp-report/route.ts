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

  return NextResponse.json({ ok: true }, { status: 204 });
}

// Tarayicilar `Content-Type: application/csp-report` ile POST eder; Next.js
// JSON parser bu tipi varsayilan olarak kabul etmez ama request.json() tipten
// bagimsiz yine de body'yi parse eder (body stream JSON gecerli).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
