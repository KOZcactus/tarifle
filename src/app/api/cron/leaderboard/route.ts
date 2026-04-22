import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { BadgeKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/leaderboard/score";
import { grantBadge } from "@/lib/badges/service";

/**
 * Faz 1 leaderboard rozet atama cron'u (TARIFLE_ULTIMATE_PLAN §35).
 * Pazartesi 05:00 UTC, vercel.json schedule.
 *
 * **İki rozet ailesi:**
 * - **Period-based** (WEEKLY/MONTHLY/ALL_TIME_TOP): O penceredeki Top 10 / 50
 *   kullanıcılarına idempotent grant. grantBadge unique constraint sayesinde
 *   tekrarlı çağrıda no-op. Description "bir hafta/ay/zamanlar" anısı, silinmez.
 * - **Threshold-based** (EXPERIENCED/PHOTOGRAPHER/CATEGORY_MASTER): Toplam
 *   etkinlik eşiği aşıldığında verilir, kalıcı. Trigger anında award eden
 *   inline path yok (eski badge'lerde olduğu gibi), bu cron tek toparlama
 *   noktası.
 *
 * EDITOR_CHOICE manuel atanır (admin tool, P3-ileride), cron dokunmaz.
 *
 * **Auth:** x-vercel-cron header VEYA Bearer LEADERBOARD_CRON_SECRET.
 * audit-report pattern'iyle paralel.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXPERIENCED_THRESHOLD = 5;
const PHOTOGRAPHER_THRESHOLD = 10;
const CATEGORY_MASTER_THRESHOLD = 5;

interface AwardSummary {
  weekly: number;
  monthly: number;
  allTime: number;
  experienced: number;
  photographer: number;
  categoryMaster: number;
  totalNew: number;
}

async function awardToUserIds(
  userIds: string[],
  key: BadgeKey,
): Promise<number> {
  let granted = 0;
  for (const userId of userIds) {
    const isNew = await grantBadge(userId, key);
    if (isNew) granted += 1;
  }
  return granted;
}

async function getExperiencedUserIds(): Promise<string[]> {
  const rows = await prisma.variation.groupBy({
    by: ["authorId"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
    having: { authorId: { _count: { gte: EXPERIENCED_THRESHOLD } } },
  });
  return rows.map((r) => r.authorId);
}

async function getPhotographerUserIds(): Promise<string[]> {
  const rows = await prisma.recipePhoto.groupBy({
    by: ["userId"],
    where: { status: "VISIBLE", userId: { not: null } },
    _count: { _all: true },
    having: { userId: { _count: { gte: PHOTOGRAPHER_THRESHOLD } } },
  });
  return rows
    .map((r) => r.userId)
    .filter((id): id is string => id !== null);
}

async function getCategoryMasterUserIds(): Promise<string[]> {
  // (user × category) pair'lerinden 5+ olanları bul, sonra distinct user.
  // Bir kullanıcı birden fazla kategoride hak kazansa da rozet bir kere verilir
  // (config'deki açıklama "Bir kategoride 5+ uyarlama").
  const rows = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT DISTINCT v."authorId" AS "userId"
    FROM variations v
    JOIN recipes r ON r.id = v."recipeId"
    WHERE v.status = 'PUBLISHED'
    GROUP BY v."authorId", r."categoryId"
    HAVING COUNT(*) >= ${CATEGORY_MASTER_THRESHOLD}
  `;
  return rows.map((r) => r.userId);
}

export async function GET(request: Request): Promise<NextResponse> {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron) {
    const secret = process.env.LEADERBOARD_CRON_SECRET;
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "LEADERBOARD_CRON_SECRET is not configured" },
        { status: 503 },
      );
    }
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const startedAt = Date.now();

  // Period-based: getLeaderboard zaten unstable_cache ile sarılı, ama bu cron
  // gerçek-zamanlı snapshot ister. Cache 15 dk TTL, cron pazartesi 05:00 UTC
  // tek seferlik iş, stale read kabul. Daha agresif istenirse `noStore` veya
  // raw _computeLeaderboard export edilir.
  const [weeklyTop, monthlyTop, allTimeTop] = await Promise.all([
    getLeaderboard("WEEKLY", 10),
    getLeaderboard("MONTHLY", 10),
    getLeaderboard("ALL_TIME", 50),
  ]);

  const weeklyGranted = await awardToUserIds(
    weeklyTop.map((e) => e.userId),
    "WEEKLY_TOP_10",
  );
  const monthlyGranted = await awardToUserIds(
    monthlyTop.map((e) => e.userId),
    "MONTHLY_TOP_10",
  );
  const allTimeGranted = await awardToUserIds(
    allTimeTop.map((e) => e.userId),
    "ALL_TIME_TOP_50",
  );

  // Threshold-based aggregation
  const [experiencedUserIds, photographerUserIds, categoryMasterUserIds] =
    await Promise.all([
      getExperiencedUserIds(),
      getPhotographerUserIds(),
      getCategoryMasterUserIds(),
    ]);

  const experiencedGranted = await awardToUserIds(
    experiencedUserIds,
    "EXPERIENCED",
  );
  const photographerGranted = await awardToUserIds(
    photographerUserIds,
    "PHOTOGRAPHER",
  );
  const categoryMasterGranted = await awardToUserIds(
    categoryMasterUserIds,
    "CATEGORY_MASTER",
  );

  const summary: AwardSummary = {
    weekly: weeklyGranted,
    monthly: monthlyGranted,
    allTime: allTimeGranted,
    experienced: experiencedGranted,
    photographer: photographerGranted,
    categoryMaster: categoryMasterGranted,
    totalNew:
      weeklyGranted +
      monthlyGranted +
      allTimeGranted +
      experiencedGranted +
      photographerGranted +
      categoryMasterGranted,
  };

  const durationMs = Date.now() - startedAt;

  Sentry.addBreadcrumb({
    category: "cron.leaderboard",
    level: "info",
    message: `cron.leaderboard ran, totalNew=${summary.totalNew}`,
    data: {
      summary,
      sizes: {
        weeklyTop: weeklyTop.length,
        monthlyTop: monthlyTop.length,
        allTimeTop: allTimeTop.length,
        experiencedEligible: experiencedUserIds.length,
        photographerEligible: photographerUserIds.length,
        categoryMasterEligible: categoryMasterUserIds.length,
      },
      durationMs,
    },
  });

  return NextResponse.json({
    ok: true,
    summary,
    eligibleCounts: {
      weeklyTop: weeklyTop.length,
      monthlyTop: monthlyTop.length,
      allTimeTop: allTimeTop.length,
      experienced: experiencedUserIds.length,
      photographer: photographerUserIds.length,
      categoryMaster: categoryMasterUserIds.length,
    },
    durationMs,
  });
}
