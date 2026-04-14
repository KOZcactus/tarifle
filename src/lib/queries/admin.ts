import { prisma } from "@/lib/prisma";

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
  const [
    totalRecipes,
    totalUsers,
    totalVariations,
    pendingReports,
    flaggedVariations,
    pendingReviews,
  ] = await Promise.all([
    prisma.recipe.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.variation.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.variation.count({ where: { reportCount: { gt: 0 } } }),
    prisma.variation.count({ where: { status: "PENDING_REVIEW" } }),
  ]);

  return {
    totalRecipes,
    totalUsers,
    totalVariations,
    pendingReports,
    flaggedVariations,
    pendingReviews,
  };
}
