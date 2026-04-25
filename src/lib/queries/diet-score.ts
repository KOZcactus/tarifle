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
