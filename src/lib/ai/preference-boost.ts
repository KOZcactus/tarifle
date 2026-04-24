/**
 * G: AI v3 suggestion preference boost.
 *
 * Kullanıcının explicit (User.favoriteCuisines + favoriteTags) ve
 * implicit (son 20 bookmark'ın cuisine + tag seti) tercihlerinden
 * bir preference profile oluşturur, suggestion matchScore'una küçük
 * bir boost ekler. Rule-based collaborative filter, sıfır LLM.
 *
 * Boost eşikleri:
 *   - Cuisine eşleşmesi: +0.12
 *   - Tag eşleşmesi: +0.05 her, max +0.15 toplam
 *   - Bookmark'ta ≥2 kez görülen cuisine: +0.05 ekstra
 *
 * matchScore 0..1 aralığında; +boost sonrası 1.3'e kadar çıkabilir,
 * sort yeterli, display'de %100+ gözükmemesi için cap render'da
 * yapılabilir. Pantry match bu boost'tan ayrı hesaplanır.
 */
import type { AiSuggestion } from "./types";

export interface UserPreferenceProfile {
  favoriteCuisines: Set<string>;
  favoriteTags: Set<string>;
  bookmarkedCuisineWeights: Map<string, number>; // cuisine → count
  bookmarkedTagWeights: Map<string, number>;
}

export function emptyProfile(): UserPreferenceProfile {
  return {
    favoriteCuisines: new Set(),
    favoriteTags: new Set(),
    bookmarkedCuisineWeights: new Map(),
    bookmarkedTagWeights: new Map(),
  };
}

/**
 * Single suggestion boost score (0..0.35 aralığında). Ana matchScore
 * üzerine eklenir. Sort ve ranking için.
 */
export function computeBoost(
  suggestion: Pick<AiSuggestion, "cuisine" | "tags">,
  profile: UserPreferenceProfile,
): number {
  let boost = 0;

  // Cuisine explicit
  if (suggestion.cuisine && profile.favoriteCuisines.has(suggestion.cuisine)) {
    boost += 0.12;
  }
  // Cuisine implicit (bookmark weight)
  if (suggestion.cuisine) {
    const bookmarkCount = profile.bookmarkedCuisineWeights.get(suggestion.cuisine) ?? 0;
    if (bookmarkCount >= 2) boost += 0.05;
  }

  // Tags: her explicit match +0.05, toplamı 0.15 ile cap
  let tagBoost = 0;
  for (const tag of suggestion.tags) {
    if (profile.favoriteTags.has(tag)) tagBoost += 0.05;
    // Implicit tag (bookmark): ≥2 kez görülmüşse +0.025
    const bookmarkCount = profile.bookmarkedTagWeights.get(tag) ?? 0;
    if (bookmarkCount >= 2) tagBoost += 0.025;
  }
  boost += Math.min(tagBoost, 0.15);

  return boost;
}

/**
 * Bir liste suggestion'a boost uygula + re-sort. matchScore'u değiştirmez,
 * ayrı bir `_boostedScore` alanı hesaplanır ve sort'a uygulanır. Orijinal
 * matchScore display için korunur.
 */
export function applyBoostAndSort<T extends Pick<AiSuggestion, "cuisine" | "tags" | "matchScore">>(
  suggestions: readonly T[],
  profile: UserPreferenceProfile,
): T[] {
  if (
    profile.favoriteCuisines.size === 0 &&
    profile.favoriteTags.size === 0 &&
    profile.bookmarkedCuisineWeights.size === 0 &&
    profile.bookmarkedTagWeights.size === 0
  ) {
    // Profil boş, boost yok
    return [...suggestions];
  }

  return [...suggestions]
    .map((s) => ({
      item: s,
      boosted: s.matchScore + computeBoost(s, profile),
    }))
    .sort((a, b) => b.boosted - a.boosted)
    .map((x) => x.item);
}
