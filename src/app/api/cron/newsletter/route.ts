import { NextResponse } from "next/server";
import {
  getActiveSubscribers,
  getNewsletterContent,
} from "@/lib/queries/newsletter";
import { sendWeeklyNewsletter } from "@/lib/email/newsletter-weekly";

/**
 * Haftalık "Editör Seçimi" bülten gönderim endpoint'i.
 *
 * **Auth:** `Authorization: Bearer $NEWSLETTER_CRON_SECRET` zorunlu.
 * Secret env var set edilmediyse endpoint sessiz 503 döner (yanlış
 * kurulum prod'da mail bombalamasın).
 *
 * **Scheduler seçenekleri** (bkz. `docs/NEWSLETTER_CRON_SETUP.md`):
 *   1. Upstash QStash — haftalık `publish` + endpoint URL (önerilen,
 *      retry + dead-letter + signature verification hazır altyapı).
 *   2. Vercel Cron (Hobby 1/day, Pro no-limit) — `vercel.json`'a
 *      `schedule: "0 7 * * 1"` (Pazartesi 10:00 TSİ = 07:00 UTC).
 *   3. Manuel tetik — `curl -H "Authorization: Bearer $SECRET"` ile
 *      admin paneli entegrasyonu veya GitHub Action.
 *
 * **Akış:**
 *   1. Bearer secret kontrol.
 *   2. Aktif aboneleri + editoryel içerik (featured + recent + cuisine)
 *      paralel çek.
 *   3. Her abone için `sendWeeklyNewsletter` — locale-aware HTML + text.
 *      Sequential loop (Resend free tier 10/sec, 100 subscriber ≈ 10s).
 *      Tek başarısız abone tüm batch'i bloklamaz.
 *   4. Summary JSON döndür (sent/failed/duration).
 *
 * **Idempotency:** Endpoint her çağrılışta mail gönderir — aynı gün
 * iki kez tetiklenirse abone iki kez mail alır. Scheduler frekansı
 * (haftada 1) bu riski üstlenir; endpoint tarafında dedup tutmaya
 * gerek yok (son gönderim zamanı takibi ayrı bir feature, yok şimdilik).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_BATCH_DELAY_MS = 100; // Resend ~10/sec safe

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "NEWSLETTER_CRON_SECRET is not configured",
      },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Constant-time comparison would be safer, but the runtime cost of a
  // string === on a short secret is negligible vs the value of guarding
  // a write endpoint. If `authHeader` length differs we short-circuit.
  if (authHeader !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const [subscribers, content] = await Promise.all([
      getActiveSubscribers(),
      getNewsletterContent(),
    ]);

    if (subscribers.length === 0) {
      return NextResponse.json({
        ok: true,
        total: 0,
        sent: 0,
        failed: 0,
        durationMs: Date.now() - startedAt,
        note: "no active subscribers",
      });
    }

    if (content.featured.length === 0 && content.recent.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "no featured or recent recipes available — skipping send to protect list quality",
        },
        { status: 500 },
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: { email: string; error: string }[] = [];

    for (const subscriber of subscribers) {
      try {
        const result = await sendWeeklyNewsletter(subscriber, content);
        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push({
            email: maskEmail(subscriber.email),
            error: result.error ?? "unknown",
          });
        }
      } catch (err) {
        failed++;
        errors.push({
          email: maskEmail(subscriber.email),
          error: err instanceof Error ? err.message : "unexpected error",
        });
      }

      if (DEFAULT_BATCH_DELAY_MS > 0) {
        await sleep(DEFAULT_BATCH_DELAY_MS);
      }
    }

    return NextResponse.json({
      ok: true,
      total: subscribers.length,
      sent,
      failed,
      durationMs: Date.now() - startedAt,
      errors: errors.slice(0, 10), // cap log payload
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unexpected error",
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mask email in error responses so the endpoint's JSON payload doesn't
 * leak subscriber addresses if it ever ends up in a log aggregator. Keeps
 * enough of the address to debug ("j***@gmail.com").
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const prefix = local.slice(0, 1);
  return `${prefix}***@${domain}`;
}
