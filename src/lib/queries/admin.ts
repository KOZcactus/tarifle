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
    pendingReviews,
    totalBookmarks,
    totalCollections,
    recipesToday,
    recipesThisWeek,
    recipesThisMonth,
    nutritionCount,
    featuredCount,
  ] = await Promise.all([
    prisma.recipe.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.variation.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.variation.count({ where: { reportCount: { gt: 0 } } }),
    prisma.variation.count({ where: { status: "PENDING_REVIEW" } }),
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
  ]);

  const nutritionCoverage = totalRecipes > 0
    ? Number(((nutritionCount / totalRecipes) * 100).toFixed(1))
    : 0;
  const featuredRatio = totalRecipes > 0
    ? Number(((featuredCount / totalRecipes) * 100).toFixed(1))
    : 0;

  return {
    totalRecipes,
    totalUsers,
    totalVariations,
    pendingReports,
    flaggedVariations,
    pendingReviews,
    totalBookmarks,
    totalCollections,
    recipesToday,
    recipesThisWeek,
    recipesThisMonth,
    nutritionCount,
    nutritionCoverage,
    featuredCount,
    featuredRatio,
  };
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
