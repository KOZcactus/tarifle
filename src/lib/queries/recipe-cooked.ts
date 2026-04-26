import { prisma } from "@/lib/prisma";

/**
 * "Pişirdim" rozet sistemi (oturum 23) için query helper'lar.
 * Bookmark pattern'iyle paralel: kullanıcı tarif başına en fazla bir
 * RecipeCooked kayıdı tutar (@@unique). toggle on/off, count distinct
 * user → "X kişi pişirdi" sosyal kanıt.
 */

export async function isCookedByUser(
  userId: string,
  recipeId: string,
): Promise<boolean> {
  const row = await prisma.recipeCooked.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
    select: { id: true },
  });
  return row !== null;
}

export async function toggleRecipeCooked(
  userId: string,
  recipeId: string,
  servings?: number,
): Promise<{ isCooked: boolean }> {
  const existing = await prisma.recipeCooked.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.recipeCooked.delete({ where: { id: existing.id } });
    return { isCooked: false };
  }
  await prisma.recipeCooked.create({
    data: {
      userId,
      recipeId,
      ...(servings !== undefined ? { servings } : {}),
    },
  });
  return { isCooked: true };
}

export async function getCookedCount(recipeId: string): Promise<number> {
  return prisma.recipeCooked.count({ where: { recipeId } });
}

export async function getCookedCountsForRecipes(
  recipeIds: readonly string[],
): Promise<Map<string, number>> {
  if (recipeIds.length === 0) return new Map();
  // Raw SQL: Prisma groupBy bazi versiyonlarda LATERAL subquery
  // genisletmesi yapip Sentry'de N+1 query olarak gozukebiliyor
  // (oturum 23 alarm, /tarifler sayfasi). Garantili tek query icin
  // $queryRaw + ANY($1::text[]) kullaniyoruz; ayni semantik, 1 SQL.
  const rows = await prisma.$queryRaw<
    { recipeId: string; cnt: bigint }[]
  >`SELECT "recipeId", COUNT(*)::bigint AS cnt
    FROM "recipe_cooked"
    WHERE "recipeId" = ANY(${[...recipeIds]}::text[])
    GROUP BY "recipeId"`;
  return new Map(rows.map((r) => [r.recipeId, Number(r.cnt)]));
}

export async function getUserCookedRecipeIds(
  userId: string,
): Promise<Set<string>> {
  const rows = await prisma.recipeCooked.findMany({
    where: { userId },
    select: { recipeId: true },
  });
  return new Set(rows.map((r) => r.recipeId));
}

/**
 * Son N gunde en cok pisirilen tarifler. Anasayfa "Bu hafta en cok
 * pisirilenler" shelf'i icin. Distinct user count desc, ekstrem populeri
 * top'a tasir. Yeni sitede cooked verisi az olabilir, sonuc bos ise
 * shelf gizlenir (caller karar verir).
 *
 * Performans: tek SQL query (raw, GROUP BY + COUNT(DISTINCT)). recipe_
 * cooked.recipeId index var; cookedAt filter (BETWEEN) da hizli.
 */
export async function getMostCookedRecentlyRecipeIds(
  options: { days?: number; limit?: number } = {},
): Promise<string[]> {
  const { days = 7, limit = 8 } = options;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<{ recipeId: string }[]>`
    SELECT "recipeId"
    FROM "recipe_cooked"
    WHERE "cookedAt" >= ${since}
    GROUP BY "recipeId"
    ORDER BY COUNT(DISTINCT "userId") DESC, MAX("cookedAt") DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.recipeId);
}

interface UserCookedListItem {
  id: string;
  recipeId: string;
  cookedAt: Date;
  servings: number | null;
  recipe: {
    slug: string;
    title: string;
    emoji: string | null;
    averageCalories: number | null;
    totalMinutes: number;
    cuisine: string | null;
    type: string;
  };
}

export async function getUserCookedRecipes(
  userId: string,
  limit = 50,
): Promise<UserCookedListItem[]> {
  const rows = await prisma.recipeCooked.findMany({
    where: { userId, recipe: { status: "PUBLISHED" } },
    orderBy: { cookedAt: "desc" },
    take: limit,
    select: {
      id: true,
      recipeId: true,
      cookedAt: true,
      servings: true,
      recipe: {
        select: {
          slug: true,
          title: true,
          emoji: true,
          averageCalories: true,
          totalMinutes: true,
          cuisine: true,
          type: true,
        },
      },
    },
  });
  return rows;
}
