/**
 * Diyet skoru DB query helpers (oturum 20).
 *
 * Pre-compute pipeline (scripts/compute-diet-scores.ts) RecipeDietScore
 * tablosunu doldurur. Bu helper'lar UI'da read-only kullanim icin.
 */
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/diet-scoring/types";

/**
 * Tarif + diyet ciftine ait pre-computed skor. RecipeDietScore tablosu
 * bos donerse (yeni tarif henuz compute edilmemis) null. Cache 30 dk;
 * recipe edit hook'ta targeted invalidate gerekirse Faz 1 sonrasi
 * eklenebilir.
 */
export const getRecipeDietScore = unstable_cache(
  async (recipeId: string, dietSlug: string): Promise<ScoreResult | null> => {
    const row = await prisma.recipeDietScore.findUnique({
      where: { recipeId_dietSlug: { recipeId, dietSlug } },
      select: { score: true, breakdown: true },
    });
    if (!row) return null;
    const breakdown = row.breakdown as unknown as Omit<ScoreResult, "score">;
    return {
      score: row.score,
      ...breakdown,
    };
  },
  ["recipe-diet-score-v1"],
  { revalidate: 1800, tags: ["recipe-diet-scores"] },
);

/**
 * Tarif + tum preset'ler icin batched skor donar. Listeleme sayfalarinda
 * recipe card badge render etmek icin kullanilir (kullanici tek diyet
 * secse de; gelecekte multi-select Faz 3 icin hazir).
 */
export async function getRecipeDietScoresForSlugs(
  recipeId: string,
  dietSlugs: string[],
): Promise<Record<string, ScoreResult>> {
  if (dietSlugs.length === 0) return {};
  const rows = await prisma.recipeDietScore.findMany({
    where: { recipeId, dietSlug: { in: dietSlugs } },
    select: { dietSlug: true, score: true, breakdown: true },
  });
  const result: Record<string, ScoreResult> = {};
  for (const row of rows) {
    const breakdown = row.breakdown as unknown as Omit<ScoreResult, "score">;
    result[row.dietSlug] = { score: row.score, ...breakdown };
  }
  return result;
}

/**
 * Kompakt diyet badge verisi (RecipeCard.dietBadge prop'una uyar). Tam
 * ScoreResult yerine sadece score + rating + isBeta dondurur, payload
 * minimum (listeleme sayfalarinda 24+ tarif paralel).
 */
export interface DietBadgeData {
  score: number;
  rating: ScoreResult["rating"];
  isBeta: boolean;
}

/**
 * Listeleme sayfalari icin batched diyet badge fetcher. Bir kullanicinin
 * dietSlug'ina gore N tarifin compact skor verisini Map olarak doner.
 * Kullanici dietProfile yoksa ya da showDietBadge false ise cagirilmamali
 * (boolean wrap ile sayfada erken donus).
 */
export async function getDietBadgesForRecipes(
  recipeIds: string[],
  dietSlug: string,
): Promise<Map<string, DietBadgeData>> {
  const result = new Map<string, DietBadgeData>();
  if (recipeIds.length === 0) return result;

  const rows = await prisma.recipeDietScore.findMany({
    where: { recipeId: { in: recipeIds }, dietSlug },
    select: { recipeId: true, score: true, breakdown: true },
  });
  for (const row of rows) {
    const breakdown = row.breakdown as unknown as {
      rating: ScoreResult["rating"];
      isBeta: boolean;
    };
    result.set(row.recipeId, {
      score: row.score,
      rating: breakdown.rating,
      isBeta: breakdown.isBeta,
    });
  }
  return result;
}

/**
 * Kullanici diyet tercihini ve badge gorunurluk toggle'ini ozet getirir.
 * Listeleme sayfalari early-return guard icin kullanir; null donuyorsa
 * misafir veya dietProfile bos.
 */
export async function getUserDietContext(
  userId: string,
): Promise<{ dietProfile: string; showDietBadge: boolean } | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { dietProfile: true, showDietBadge: true },
  });
  if (!row?.dietProfile || !row.showDietBadge) return null;
  return { dietProfile: row.dietProfile, showDietBadge: row.showDietBadge };
}

/**
 * Diyet skoruna gore siralanmis recipe ID listesini doner. /tarifler
 * "Diyetime uygun" sort opsiyonu kullanir; relevance branch'iyle ayni
 * mantigi paylasiyor (recipeIds dizi sirasina gore JS sort).
 *
 * Score DESC + tie-break score DESC (computedAt rastgele degil, deterministic).
 * Misafir veya dietSlug bilinmiyorsa bos liste.
 */
export async function getDietSortedRecipeIds(
  dietSlug: string,
): Promise<string[]> {
  const rows = await prisma.recipeDietScore.findMany({
    where: { dietSlug },
    select: { recipeId: true },
    orderBy: [{ score: "desc" }, { recipeId: "asc" }],
  });
  return rows.map((r) => r.recipeId);
}

/**
 * Convenience: listeleme sayfasi user session'ini + recipe ID listesini
 * verir, diyet badge Map'i alir. Misafir veya dietProfile yoksa bos Map.
 */
export async function getDietBadgesIfApplicable(
  userId: string | null,
  recipeIds: string[],
): Promise<Map<string, DietBadgeData>> {
  if (!userId || recipeIds.length === 0) return new Map();
  const ctx = await getUserDietContext(userId);
  if (!ctx) return new Map();
  return getDietBadgesForRecipes(recipeIds, ctx.dietProfile);
}
