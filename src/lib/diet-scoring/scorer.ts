/**
 * Diyet skoru ana hesaplama fonksiyonu (oturum 20, DIET_SCORE_PLAN.md).
 *
 * `score(recipe, dietSlug)` → { score: 0-100, criteria: [...], rating, isBeta }
 *
 * Saf fonksiyon, no DB call, deterministic. RecipeDietScore tablosunu
 * dolduran pre-compute pipeline + on-demand recipe detail çağrıları
 * için kullanılır.
 */

import { getDietProfile } from "./profiles";
import type { RecipeForScoring, ScoreResult, CriterionResult } from "./types";

/**
 * Skor eşik aralıkları (DIET_SCORE_PLAN §4):
 *   85-100 mukemmel | 70-84 iyi | 50-69 orta | 30-49 zayif | 0-29 uyumsuz
 */
function ratingFromScore(score: number): ScoreResult["rating"] {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "weak";
  return "poor";
}

/**
 * Eksik veri uyarısı, requiresEnrichedData true preset'ler için Faz 1
 * BETA'da gösterilir. Faz 2 sonrası USDA enrichment ile kaldırılır.
 */
function approximationFlagFor(profileSlug: string): string | undefined {
  if (profileSlug === "dusuk-seker") {
    return "Şeker hesaplaması Faz 1'de proxy (karbonhidrat oranı). USDA enrichment sonrası kesinleşecek.";
  }
  return undefined;
}

/**
 * Ana skor fonksiyonu. Profile slug bilinmiyorsa null döner.
 *
 * Edge case'ler:
 *  - Eksik macro verisi: criterion bazında 0 puan, breakdown'da "veri yok" note
 *  - Tüm makro null: skor 0, rating "poor", approximationFlag set
 *  - dietSlug bilinmiyor: null
 */
export function scoreRecipe(
  recipe: RecipeForScoring,
  dietSlug: string,
): ScoreResult | null {
  const profile = getDietProfile(dietSlug);
  if (!profile) return null;

  const criteria: CriterionResult[] = profile.criteria.map((cdef) => {
    const result = cdef.compute(recipe);
    return {
      label: cdef.label,
      score: result.score,
      max: cdef.max,
      fit: result.fit,
      note: result.note,
      status: result.status,
    };
  });

  const totalScore = criteria.reduce((a, c) => a + c.score, 0);
  const clampedScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: clampedScore,
    rating: ratingFromScore(clampedScore),
    criteria,
    // Faz 1'de tüm preset'ler beta. Faz 2 stable sonrası Kerem manuel
    // kapatabilir (profiles.ts'e isStable flag eklenir o aşamada).
    isBeta: true,
    approximationFlag: approximationFlagFor(dietSlug),
  };
}

/**
 * Tarif için tüm preset'lerin skorlarını topla. Pre-compute pipeline
 * 3452 tarif × 6 preset için bunu kullanır. Profile bilinmiyorsa atlar.
 */
export function scoreRecipeForAllProfiles(
  recipe: RecipeForScoring,
  dietSlugs: string[],
): Record<string, ScoreResult> {
  const result: Record<string, ScoreResult> = {};
  for (const slug of dietSlugs) {
    const score = scoreRecipe(recipe, slug);
    if (score) result[slug] = score;
  }
  return result;
}
