/**
 * AI Asistan reason chip üretimi. Kural tabanlı "neden bu tarif?" açıklaması,
 * localize edilmiş, kısa chip dizisi. v3 sıkılaştırmada eklendi.
 *
 * Öncelik: missing ingredient durumunu vurgulamak (kullanıcı dolabına bakınca
 * hızlı karar versin) + süre bilgisi ("hemen yapabilirim" sinyali).
 *
 * Mevcut UI zaten match %, cuisine bayrak, tag chip göstermekte. Reason chip
 * bunların üzerine **değer katar**: spesifik eksik malzeme adı + süre
 * urgency (15 dk altı = "⚡ hızlı").
 */
import { getTranslations } from "next-intl/server";
import type { AiSuggestInput, AiSuggestion } from "./types";

const FAST_THRESHOLD_MIN = 15;
const QUICK_THRESHOLD_MIN = 30;
const MAX_INGREDIENT_LABEL_CHARS = 24;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/**
 * Tek tarife 1-3 reason chip üretir. Sıra: (1) match/missing bilgisi,
 * (2) süre. Cuisine ve diet chip'leri UI'da mevcut (tag + flag), tekrar
 * koymuyoruz.
 */
export async function buildReasons(
  suggestion: Pick<AiSuggestion, "matchedIngredients" | "missingIngredients" | "totalMinutes">,
  input: Pick<AiSuggestInput, "maxMinutes">,
): Promise<string[]> {
  const t = await getTranslations("aiAssistant.result.reasons");
  const reasons: string[] = [];

  const missingCount = suggestion.missingIngredients.length;
  const matchedCount = suggestion.matchedIngredients.length;
  const totalCount = matchedCount + missingCount;

  // 1. Missing vurgu
  if (missingCount === 0 && totalCount > 0) {
    reasons.push(t("allMatched"));
  } else if (missingCount === 1) {
    const ing = truncate(suggestion.missingIngredients[0]!, MAX_INGREDIENT_LABEL_CHARS);
    reasons.push(t("oneMissing", { ingredient: ing }));
  } else if (missingCount === 2) {
    const list = suggestion.missingIngredients
      .slice(0, 2)
      .map((x) => truncate(x, MAX_INGREDIENT_LABEL_CHARS))
      .join(", ");
    reasons.push(t("twoMissing", { list }));
  } else if (missingCount > 0 && matchedCount > 0) {
    reasons.push(t("fewMissing", { matched: matchedCount, total: totalCount }));
  }

  // 2. Süre urgency
  const mins = suggestion.totalMinutes;
  if (mins > 0) {
    if (mins <= FAST_THRESHOLD_MIN) {
      reasons.push(t("veryFast", { minutes: mins }));
    } else if (mins <= QUICK_THRESHOLD_MIN) {
      reasons.push(t("quick", { minutes: mins }));
    } else if (input.maxMinutes && mins <= input.maxMinutes) {
      reasons.push(t("withinTime", { minutes: mins }));
    }
  }

  return reasons;
}
