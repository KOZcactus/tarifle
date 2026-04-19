import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pingIndexNow, getSiteBaseUrl, isValidKey } from "@/lib/indexnow";

/**
 * Haftalık IndexNow batch ping — son 7 gün içinde eklenmiş veya
 * güncellenmiş PUBLISHED tarifleri Bing/Yandex/Seznam'a push eder.
 *
 * **Auth — iki yol kabul edilir:**
 *   1. Vercel Cron: `x-vercel-cron: 1` header (Vercel edge enjekte eder,
 *      dışarıdan spoof edilemez çünkü `x-vercel-*` external istekte
 *      sıyrılır). vercel.json'daki cron tanımı otomatik bu yoldan gelir.
 *   2. Manuel tetik / QStash: `Authorization: Bearer $INDEXNOW_CRON_SECRET`.
 *
 * Secret set değilse ve Vercel Cron header'ı da yoksa 503/401.
 *
 * **Scheduler:** Vercel Cron veya Upstash QStash. Önerilen frekans:
 *   - Haftalık (`0 8 * * 1`) — son 7 gün yeni/güncellenen
 *   - Günlük ince tuning için `?recent=24h` query param
 *
 * **Idempotency:** IndexNow aynı URL'yi tekrar kabul eder (spec: "no
 * penalty for re-submission"). Aynı gün 2 tetik olursa sadece bandwidth
 * israfı, yan etki yok.
 *
 * **Kapsam:** Sitemap 2000+ URL'ye şişse bile bu endpoint sadece son
 * 7 gün diff'ini gönderir — initial bulk için `scripts/indexnow-ping.ts
 * --all` kullanılır, cron taze değişikliği follow eder.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_WINDOW_DAYS = 7;

export async function GET(request: Request): Promise<NextResponse> {
  if (!isValidKey(process.env.INDEXNOW_KEY)) {
    return NextResponse.json(
      { ok: false, error: "INDEXNOW_KEY is not configured or invalid" },
      { status: 503 },
    );
  }

  // Vercel Cron: "x-vercel-cron: 1" edge tarafından enjekte edilir,
  // external istekte bu header sıyrılır → spoof edilemez.
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron) {
    const secret = process.env.INDEXNOW_CRON_SECRET;
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "INDEXNOW_CRON_SECRET is not configured" },
        { status: 503 },
      );
    }
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
  }

  const url = new URL(request.url);
  const days = clampInt(url.searchParams.get("days"), DEFAULT_WINDOW_DAYS, 1, 90);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const recipes = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      updatedAt: { gte: since },
    },
    orderBy: { updatedAt: "desc" },
    select: { slug: true },
    take: 10_000, // IndexNow single-request cap
  });

  const base = getSiteBaseUrl();
  const urls = recipes.map((r) => `${base}/tarif/${r.slug}`);

  // Yeni içerik yoksa homepage + son-güncel listing'i ping — arama
  // motorları taze crawl sinyali alsın.
  if (urls.length === 0) {
    urls.push(`${base}/`, `${base}/tarifler`, `${base}/kesfet`);
  }

  const started = Date.now();
  const result = await pingIndexNow(urls);
  const durationMs = Date.now() - started;

  return NextResponse.json({
    ok: result.ok,
    windowDays: days,
    collected: urls.length,
    submitted: result.submitted,
    skipped: result.skipped ?? 0,
    status: result.status,
    reason: result.reason,
    durationMs,
  });
}

function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
