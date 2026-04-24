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
import type { AiReason, AiSuggestInput, AiSuggestion } from "./types";

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
): Promise<AiReason[]> {
  const t = await getTranslations("aiAssistant.result.reasons");
  const reasons: AiReason[] = [];

  const missingCount = suggestion.missingIngredients.length;
  const matchedCount = suggestion.matchedIngredients.length;
  const totalCount = matchedCount + missingCount;

  // 1. Missing vurgu - pantry kind (yeşil, dolap uyumu sinyali)
  if (missingCount === 0 && totalCount > 0) {
    reasons.push({ kind: "pantry", text: t("allMatched") });
  } else if (missingCount === 1) {
    const ing = truncate(suggestion.missingIngredients[0]!, MAX_INGREDIENT_LABEL_CHARS);
    reasons.push({ kind: "pantry", text: t("oneMissing", { ingredient: ing }) });
  } else if (missingCount === 2) {
    const list = suggestion.missingIngredients
      .slice(0, 2)
      .map((x) => truncate(x, MAX_INGREDIENT_LABEL_CHARS))
      .join(", ");
    reasons.push({ kind: "pantry", text: t("twoMissing", { list }) });
  } else if (missingCount > 0 && matchedCount > 0) {
    reasons.push({
      kind: "pantry",
      text: t("fewMissing", { matched: matchedCount, total: totalCount }),
    });
  }

  // 2. Süre urgency - time kind (mavi, "hemen yapabilirim" sinyali)
  const mins = suggestion.totalMinutes;
  if (mins > 0) {
    if (mins <= FAST_THRESHOLD_MIN) {
      reasons.push({ kind: "time", text: t("veryFast", { minutes: mins }) });
    } else if (mins <= QUICK_THRESHOLD_MIN) {
      reasons.push({ kind: "time", text: t("quick", { minutes: mins }) });
    } else if (input.maxMinutes && mins <= input.maxMinutes) {
      reasons.push({ kind: "time", text: t("withinTime", { minutes: mins }) });
    }
  }

  return reasons;
}
