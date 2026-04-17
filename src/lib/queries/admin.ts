import { prisma } from "@/lib/prisma";
import { CUISINE_LABEL, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";

/** Bekleyen raporları getir */
export async function getPendingReports() {
  return prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: {
        select: { username: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Tüm raporları getir (filtreleme ile) */
export async function getReports(status?: string) {
  const where: Record<string, unknown> = {};
  if (status && ["PENDING", "REVIEWED", "DISMISSED"].includes(status)) {
    where.status = status;
  }

  return prisma.report.findMany({
    where,
    include: {
      reporter: {
        select: { username: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Preflight tarafından PENDING_REVIEW'a düşmüş yorumlar */
export async function getPendingReviews() {
  return prisma.review.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, username: true } },
      recipe: { select: { slug: true, title: true } },
    },
  });
}

/** Hakkında PENDING rapor olan yorumlar — raporlar sayfasındaki review bölümü */
export async function getReportedReviews() {
  const pendingReports = await prisma.report.findMany({
    where: { targetType: "REVIEW", status: "PENDING" },
    select: { targetId: true },
  });
  const ids = Array.from(new Set(pendingReports.map((r) => r.targetId)));
  if (ids.length === 0) return [];

  return prisma.review.findMany({
    where: { id: { in: ids } },
    include: {
      user: { select: { id: true, username: true, name: true } },
      recipe: { select: { title: true, slug: true, emoji: true } },
    },
  });
}

/** Raporlanmış uyarlamaları getir (reportCount > 0) */
export async function getFlaggedVariations() {
  return prisma.variation.findMany({
    where: { reportCount: { gt: 0 } },
    include: {
      author: {
        select: { username: true, name: true },
      },
      recipe: {
        select: { title: true, slug: true, emoji: true },
      },
    },
    orderBy: { reportCount: "desc" },
    take: 50,
  });
}

/** Admin istatistikleri */
export async function getAdminStats() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);

  const [
    totalRecipes,
    totalUsers,
    totalVariations,
    pendingReports,
    flaggedVariations,
    pendingVariations,
    pendingReviewsQueue,
    totalBookmarks,
    totalCollections,
    recipesToday,
    recipesThisWeek,
    recipesThisMonth,
    nutritionCount,
    featuredCount,
    reviewAggregate,
    reviewTotal,
    emailVerifiedCount,
    imagelessCount,
    zeroViewCount,
  ] = await Promise.all([
    prisma.recipe.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.variation.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.variation.count({ where: { reportCount: { gt: 0 } } }),
    prisma.variation.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.review.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.bookmark.count(),
    prisma.collection.count(),
    prisma.recipe.count({
      where: { status: "PUBLISHED", createdAt: { gte: dayStart } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", createdAt: { gte: weekStart } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", createdAt: { gte: monthStart } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", averageCalories: { not: null } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", isFeatured: true },
    }),
    // Review v2: average + count aggregate (sadece PUBLISHED review'lar)
    prisma.review.aggregate({
      where: { status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.count(), // all statuses (PUBLISHED + HIDDEN + PENDING)
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", imageUrl: null },
    }),
    prisma.recipe.count({ where: { status: "PUBLISHED", viewCount: 0 } }),
  ]);

  const nutritionCoverage = totalRecipes > 0
    ? Number(((nutritionCount / totalRecipes) * 100).toFixed(1))
    : 0;
  const featuredRatio = totalRecipes > 0
    ? Number(((featuredCount / totalRecipes) * 100).toFixed(1))
    : 0;
  const emailVerifiedRatio = totalUsers > 0
    ? Number(((emailVerifiedCount / totalUsers) * 100).toFixed(1))
    : 0;
  const imagelessRatio = totalRecipes > 0
    ? Number(((imagelessCount / totalRecipes) * 100).toFixed(1))
    : 0;

  // Unified "inceleme bekliyor" — variation + review preflight kuyrukları
  const pendingQueueTotal = pendingVariations + pendingReviewsQueue;

  return {
    totalRecipes,
    totalUsers,
    totalVariations,
    pendingReports,
    flaggedVariations,
    // Kept for backward-compat; yeni dashboard pendingQueueTotal'ı tercih eder
    pendingReviews: pendingVariations,
    pendingVariations,
    pendingReviewsQueue,
    pendingQueueTotal,
    totalBookmarks,
    totalCollections,
    recipesToday,
    recipesThisWeek,
    recipesThisMonth,
    nutritionCount,
    nutritionCoverage,
    featuredCount,
    featuredRatio,
    // Review v2 stats
    reviewCount: reviewAggregate._count,
    reviewAverage: reviewAggregate._avg.rating
      ? Number(reviewAggregate._avg.rating.toFixed(2))
      : null,
    reviewTotal, // includes hidden/pending — for moderation health
    // User health
    emailVerifiedCount,
    emailVerifiedRatio,
    // Content quality
    imagelessCount,
    imagelessRatio,
    zeroViewCount,
  };
}

/**
 * En çok görüntülenen N tarif — editorial/featured karar vermek için.
 * Trendleri anlamak için viewCount DESC, sadece PUBLISHED.
 */
export async function getTopViewedRecipes(
  limit = 5,
): Promise<{ slug: string; title: string; emoji: string | null; viewCount: number; isFeatured: boolean }[]> {
  return prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: {
      slug: true,
      title: true,
      emoji: true,
      viewCount: true,
      isFeatured: true,
    },
  });
}

/**
 * Son N kullanıcı kaydı — onboarding akışını izlemek + yeni kullanıcılara
 * hoşgeldin e-maili / incelemesi için fikir verir.
 */
export async function getRecentSignups(
  limit = 10,
): Promise<
  {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
    createdAt: Date;
    emailVerified: Date | null;
    role: string;
  }[]
> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      createdAt: true,
      emailVerified: true,
      role: true,
    },
  });
}

/**
 * Son N gün günlük signup — user growth bar chart için.
 * Boş günler 0'la doldurulur (chart'ta gap yerine düz bar gözüksün).
 */
export async function getUserGrowthDaily(
  days = 30,
): Promise<{ day: string; count: number }[]> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT
      date_trunc('day', "createdAt") AS day,
      COUNT(*)::bigint AS count
    FROM users
    WHERE "createdAt" >= ${start}
    GROUP BY day
    ORDER BY day ASC
  `;

  // Fill gaps: API her günü tuttuğu için chart'ta continuous görünür.
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = row.day.toISOString().slice(0, 10);
    byDay.set(key, Number(row.count));
  }

  const result: { day: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return result;
}

/**
 * Review yıldız dağılımı (1-5 yıldız her biri için count).
 * Summary card'da mini bar chart olarak gösterilir.
 */
export async function getReviewDistribution(): Promise<Record<1 | 2 | 3 | 4 | 5, number>> {
  const rows = await prisma.review.groupBy({
    by: ["rating"],
    where: { status: "PUBLISHED" },
    _count: true,
  });

  const dist: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };
  for (const r of rows) {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      dist[rating] = r._count;
    }
  }
  return dist;
}

/**
 * Son N batch — Recipe.createdAt günleri gruplayıp en yeni N grubu döner.
 * Codex 100 tarif/batch yazıyor, hepsi aynı dakika INSERT'lendiği için
 * "aynı saatte 50+ tarif eklenmiş" tarihler batch sınırlarıdır.
 *
 * 1 saatlik bucket'lar — birden fazla seed run'u aynı gün varsa ayırır.
 */
export async function getRecentBatches(limit = 7): Promise<
  { hour: Date; count: number }[]
> {
  // Postgres date_trunc ile saat bucket'la, count > 5 olanları al
  // (kullanıcı ekleme akışı 1-2 tarif yapabilir, batch 50+ INSERT eder).
  const rows = await prisma.$queryRaw<
    { hour: Date; count: bigint }[]
  >`
    SELECT
      date_trunc('hour', "createdAt") AS hour,
      COUNT(*)::bigint AS count
    FROM recipes
    WHERE status = 'PUBLISHED'
    GROUP BY hour
    HAVING COUNT(*) > 5
    ORDER BY hour DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ hour: r.hour, count: Number(r.count) }));
}

/**
 * Kategori başına tarif sayısı — admin'in "hangi kategori dolu, hangi
 * boş" görüşü. Sortby count desc.
 */
/**
 * Cuisine dağılımı — admin'in mutfak dengesini görmesi.
 */
export async function getCuisineBreakdown(): Promise<
  { code: string; label: string; flag: string; count: number }[]
> {
  const rows = await prisma.recipe.groupBy({
    by: ["cuisine"],
    where: { status: "PUBLISHED", cuisine: { not: null } },
    _count: true,
    orderBy: { _count: { cuisine: "desc" } },
  });
  return rows
    .filter((r) => r.cuisine)
    .map((r) => ({
      code: r.cuisine!,
      label: CUISINE_LABEL[r.cuisine as CuisineCode] ?? r.cuisine!,
      flag: CUISINE_FLAG[r.cuisine as CuisineCode] ?? "🌍",
      count: r._count,
    }));
}

export async function getCategoryBreakdown(): Promise<
  { name: string; emoji: string | null; count: number }[]
> {
  const rows = await prisma.category.findMany({
    select: {
      name: true,
      emoji: true,
      _count: {
        select: { recipes: { where: { status: "PUBLISHED" } } },
      },
    },
  });
  return rows
    .map((r) => ({ name: r.name, emoji: r.emoji, count: r._count.recipes }))
    .sort((a, b) => b.count - a.count);
}
