import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runIntegrityAudit } from "@/lib/audit/integrity-core";

/**
 * Haftalık DB integrity audit cron, runIntegrityAudit sonucunu JSON döndürür
 * ve CRITICAL finding varsa Sentry'ye breadcrumb + error eventi atar.
 *
 * **Auth, iki yol:**
 *   1. Vercel Cron: `x-vercel-cron: 1` header (edge enjekte, spoof-proof).
 *   2. Manuel / QStash: `Authorization: Bearer $AUDIT_CRON_SECRET`.
 *
 * **Schedule:** `vercel.json`'da pazartesi 07:00 UTC (10:00 TSİ, IndexNow'dan
 * 1 saat önce, günlük pik öncesi dev/prod kontrol).
 *
 * **Payload shape:** `IntegrityReport` (src/lib/audit/integrity-core.ts).
 * CRITICAL summary > 0 → Sentry.captureMessage("Tarifle integrity audit
 * CRITICAL", level: error), admin Sentry projesinde görünür.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron) {
    const secret = process.env.AUDIT_CRON_SECRET;
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "AUDIT_CRON_SECRET is not configured" },
        { status: 503 },
      );
    }
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  const report = await runIntegrityAudit();
  const durationMs = Date.now() - startedAt;

  // Sentry breadcrumb + error event (yalnızca CRITICAL > 0)
  Sentry.addBreadcrumb({
    category: "audit.integrity",
    level: report.summary.critical > 0 ? "error" : "info",
    message: `audit.integrity ran, critical=${report.summary.critical}, warning=${report.summary.warning}, info=${report.summary.info}`,
    data: {
      totals: report.totals,
      summary: report.summary,
      durationMs,
    },
  });

  if (report.summary.critical > 0) {
    const criticalMessages = report.findings
      .filter((f) => f.severity === "CRITICAL")
      .map((f) => `[${f.category}] ${f.message}`)
      .join(" | ");
    Sentry.captureMessage(
      `Tarifle integrity audit CRITICAL (${report.summary.critical}): ${criticalMessages}`,
      "error",
    );
  }

  return NextResponse.json({
    ok: true,
    report,
    durationMs,
  });
}
