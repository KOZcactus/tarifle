import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Connection warming endpoint, Vercel Cron her 4 dakikada bir hit eder,
 * Neon serverless connection'ı sıcak tutar. Scale-to-zero idle threshold
 * (Neon default 5 dk) geçmeden önce yeni request TTFB cold-start cezasını
 * ödemez.
 *
 * Dummy `SELECT 1` → lightest possible query. Auth guard yok çünkü endpoint
 * idempotent + yazma yapmıyor + sadece Vercel Cron tarafından çağrılıyor.
 * Public GET kötü niyetli bir actor tarafından spam'lenirse bile maliyet
 * DB connection pool zaten warm olduğu için minimum.
 *
 * Response body gözlemleme amaçlı, Vercel Cron dashboard'da success/fail
 * ve süre görünür.
 *
 * Doğrudan GET:
 *   curl https://tarifle.app/api/warm
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
