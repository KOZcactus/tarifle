/**
 * Recipe-level nutrition aggregate (oturum 20, DIET_SCORE_PLAN B* Faz 2).
 *
 * Saf hesap fonksiyonu, RecipeIngredient + NutritionData esleme + amount
 * parse ile per-porsiyon sugar / fiber / sodium / satFat doner. DB call
 * disinda (caller fetch eder, hesabi buraya verir), unit test edilebilir.
 *
 * Eslesme orani (matchedRatio) dondurulur: kac ingredient eslesti / toplam.
 * 0.7+ saglikli, 0.5- yaklaşık disclaimer.
 */

import { convertToGrams } from "./unit-convert";

export interface IngredientInput {
  name: string;
  /** RecipeIngredient.amount, generally just a quantity ("1", "500"). */
  amount: string;
  /** RecipeIngredient.unit, "su bardağı" / "adet" / "gr". Concatenated
   *  with amount before parser, "1" + "su bardağı" -> "1 su bardağı". */
  unit?: string | null;
  isOptional: boolean;
}

export interface NutritionLookup {
  /** Per-100g degerler */
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  sugarPer100g: number | null;
  fiberPer100g: number | null;
  sodiumPer100g: number | null;
  satFatPer100g: number | null;
  /** Ingredient-spesifik unit conversion (1 yumurta=50g) */
  defaultUnit: string | null;
  gramsPerUnit: number | null;
}

export interface RecipeAggregate {
  sugarPerServing: number | null;
  fiberPerServing: number | null;
  sodiumPerServing: number | null;
  satFatPerServing: number | null;
  /** 0-1 ingredient match orani */
  matchedRatio: number;
  /** Eslemis ingredient sayisi */
  matchedCount: number;
  /** Toplam non-optional ingredient sayisi */
  totalCount: number;
}

/**
 * Tum ingredient'lari aggregate eder, servingCount'a boler.
 * NutritionData lookup map ile O(1) ingredient match (caller fetch eder).
 *
 * Ne kadar tarifin sugar/fiber/sodium degerleri yetersizse o kadar null
 * doner; bu degerler skor hesabinda fallback proxy'ye gider.
 */
export function aggregateNutrition(
  ingredients: IngredientInput[],
  nutritionLookup: Map<string, NutritionLookup>,
  servingCount: number,
): RecipeAggregate {
  const servings = Math.max(1, servingCount);

  let totalSugar = 0;
  let totalFiber = 0;
  let totalSodium = 0;
  let totalSatFat = 0;
  let sugarSamples = 0;
  let fiberSamples = 0;
  let sodiumSamples = 0;
  let satFatSamples = 0;
  let matchedCount = 0;
  // Optional ingredient'lari da say (orta-yol nutrition tahmini)
  const totalCount = ingredients.length;

  for (const ing of ingredients) {
    const lookup = nutritionLookup.get(ing.name.toLowerCase().trim());
    if (!lookup) continue;
    matchedCount++;

    // amount + unit concat, RecipeIngredient ayri kolonlara ayrilmis
    // ("1" + "su bardağı"), parser kombine string bekliyor.
    const combined = ing.unit ? `${ing.amount} ${ing.unit}` : ing.amount;
    const grams = convertToGrams(combined, {
      ingredientName: ing.name,
      gramsPerUnit: lookup.gramsPerUnit,
      defaultUnit: lookup.defaultUnit,
    });
    if (grams === null || grams <= 0) continue;
    const factor = grams / 100;

    if (lookup.sugarPer100g !== null) {
      totalSugar += lookup.sugarPer100g * factor;
      sugarSamples++;
    }
    if (lookup.fiberPer100g !== null) {
      totalFiber += lookup.fiberPer100g * factor;
      fiberSamples++;
    }
    if (lookup.sodiumPer100g !== null) {
      totalSodium += lookup.sodiumPer100g * factor;
      sodiumSamples++;
    }
    if (lookup.satFatPer100g !== null) {
      totalSatFat += lookup.satFatPer100g * factor;
      satFatSamples++;
    }
  }

  const matchedRatio = totalCount > 0 ? matchedCount / totalCount : 0;

  // Eslesen ingredient sayisi yetersizse (≤30% match) null don, scorer
  // proxy'ye fallback yapar. Bu eshik tartisilabilir; sıkı tutmak yanlis
  // skor riski azaltir.
  const minRatioForReliable = 0.3;

  return {
    sugarPerServing:
      sugarSamples > 0 && matchedRatio >= minRatioForReliable
        ? round1(totalSugar / servings)
        : null,
    fiberPerServing:
      fiberSamples > 0 && matchedRatio >= minRatioForReliable
        ? round1(totalFiber / servings)
        : null,
    sodiumPerServing:
      sodiumSamples > 0 && matchedRatio >= minRatioForReliable
        ? round1(totalSodium / servings)
        : null,
    satFatPerServing:
      satFatSamples > 0 && matchedRatio >= minRatioForReliable
        ? round1(totalSatFat / servings)
        : null,
    matchedRatio: round3(matchedRatio),
    matchedCount,
    totalCount,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
