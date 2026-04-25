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
 * Eksik veri uyarisi, requiresEnrichedData true preset'lerde gosterilir.
 * Faz 2 USDA enrichment ile %86 tarif coverage, %14 hala proxy fallback.
 */
function approximationFlagFor(profileSlug: string): string | undefined {
  switch (profileSlug) {
    case "dusuk-seker":
      return "Şeker miktarı USDA verilerine göre hesaplanır. Eşleşmesi olmayan tariflerde karbonhidrat oranı proxy olarak kullanılır.";
    case "yuksek-lif":
      return "Lif ölçümü USDA verilerine bağlıdır. Eşleşme yetersizse skor tahmini olabilir, kesinlik için verisi olan tariflerde güvenli.";
    case "dusuk-sodyum":
      return "Sodyum tahmini USDA değerlerinden gelir. Tuz miktarı tarif kullanıcısına göre değişir; bu değerler ortalama serpiş için geçerli.";
    case "akdeniz":
      return "Akdeniz uyumu çok kriterli, USDA veri kapsamı %86. Eksik veri profili biraz değiştirebilir.";
    case "keto-hassas":
      return "Net karbonhidrat = toplam karbonhidrat - lif. Lif verisi eşleşmiyorsa toplam karbonhidrat baz alınır, daha sıkı çıkar.";
    default:
      return undefined;
  }
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

  // Beta etiketi USDA enrichment'a bagimli preset'lerde gosterilir.
  // Istisna: dusuk-seker preset'i top 80 ingredient seed sonrasi %86
  // coverage'a ulasti, eslesmeyen tariflerde carbs proxy zaten fallback;
  // kullanici icin stable kabul edilir (oturum 20 Faz 2 polish karari).
  // Diger Faz 2 preset'leri (yuksek-lif/dusuk-sodyum/akdeniz/keto-hassas)
  // proxy fallback'i yok, Beta korunur kullanici uyarilsin.
  const isBeta = profile.requiresEnrichedData && profile.slug !== "dusuk-seker";

  // Dinamik approximationFlag (oturum 20 Faz 2 polish):
  // Recipe.nutritionMatchedRatio dusukse + Faz 2 preset ise ek uyari
  // ekle, ilgili tarifin skor guvenilirlik seviyesini netlestir.
  let flag = approximationFlagFor(dietSlug);
  if (
    profile.requiresEnrichedData &&
    typeof recipe.nutritionMatchedRatio === "number" &&
    recipe.nutritionMatchedRatio < 0.5
  ) {
    const pct = Math.round(recipe.nutritionMatchedRatio * 100);
    const ratioWarning =
      "Bu tarif için besin verisi eşleşmesi %" +
      pct +
      ", skor sınırlı veri ile hesaplandı. Veri eşleşmesi yüksek tariflerde daha güvenilir.";
    flag = flag ? flag + " " + ratioWarning : ratioWarning;
  }

  return {
    score: clampedScore,
    rating: ratingFromScore(clampedScore),
    criteria,
    isBeta,
    approximationFlag: flag,
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
