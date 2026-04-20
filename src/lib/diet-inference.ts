/**
 * Diet tag inference, detect whether a recipe is vegetarian and/or vegan
 * from its ingredient list. Same conservative posture as allergen inference:
 * when in doubt, DON'T tag (false negative here is safer, a vegetarian
 * eats a non-vegetarian meal = bad; being too strict about tagging =
 * annoying but safe).
 *
 * Rules:
 *   - Vegetarian ⟺ no meat, no poultry, no fish/seafood ingredient
 *   - Vegan      ⟺ vegetarian AND no dairy, no eggs, no honey, no gelatin
 *
 * Cross-checks against the existing allergen set: if a recipe's allergens
 * include SUT or YUMURTA or DENIZ_URUNLERI, we use that as a shortcut
 * instead of re-running the keyword scan. That keeps the two inference
 * systems in sync and makes the retrofit cheaper.
 */

import type { Allergen } from "@prisma/client";

// Turkish lowercase + diacritic strip, mirrors the allergens normalizer
// (kept inline to avoid a circular import).
function normalise(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Keywords that mark a recipe as NOT vegetarian (meat/poultry/fish/gelatin).
 * Fish + seafood are also covered by the DENIZ_URUNLERI allergen, we read
 * that as a shortcut in `inferDietTags`, so this list focuses on meat and
 * poultry which don't have their own allergen group.
 */
const MEAT_KEYWORDS: readonly string[] = [
  // Red meat
  "dana",
  "kuzu",
  "koyun",
  "sigir",
  "bonfile",
  "biftek",
  "antrikot",
  "pirzola",
  "kiyma",
  "kofte",
  "kebap",
  "sucuk",
  "sosis",
  "salam",
  "pastirma",
  "jambon",
  "etli",
  "et suyu",
  "et bulyon",
  "ciger",
  "bobrek",
  "isken",
  "but eti",
  // Poultry
  "tavuk",
  "piliç",
  "pilic",
  "hindi",
  "ordek",
  "horoz",
  "kanat",
  "gogus eti",
  "kanatli",
  // Game
  "av eti",
  "karaca",
];

/**
 * Non-vegan ingredient regexes. Supplements the allergen set (SUT/YUMURTA)
 * which catches dairy/eggs; this list adds honey and gelatin.
 *
 * The "bal" pattern is the fiddly one:
 *   - Word-boundary `\bbal\b` alone false-positives on "bal kabagi" (pumpkin)
 *     because the space between "bal" and "kabagi" is a word boundary.
 *   - Negative lookahead `(?!\s+kabag)` requires that "bal" is NOT followed
 *     by whitespace and the pumpkin root.
 *   - Also excludes "balkabag" (no space, one-word form) via `(?!kabag)`.
 *
 * "balik" (fish) is already filtered earlier via hasSeafood allergen check;
 * we don't guard against it here.
 */
const NON_VEGAN_PATTERNS: readonly RegExp[] = [
  /\bbal(?!\s*kabag)\b/, // honey, but not "bal kabagi" / "balkabagi" (pumpkin)
  /\bballi\b/, // "ballı" → normalized "balli" (honey-glazed)
  /\bjelatin\b/,
  /\bgelatin\b/,
];

export interface DietTags {
  vegetarian: boolean;
  vegan: boolean;
}

/**
 * Given a recipe's ingredient names + its allergen set (from the allergens
 * inference step), return { vegetarian, vegan }.
 *
 * Callers wire the result to the Tag / RecipeTag tables, see the retrofit
 * script. This module is DB-agnostic.
 */
export function inferDietTags(
  ingredients: readonly { name: string }[],
  allergens: readonly Allergen[],
): DietTags {
  const normalized = ingredients.map((i) => normalise(i.name));

  // 1) Vegetarian check
  const hasMeat = normalized.some((n) =>
    MEAT_KEYWORDS.some((k) => n.includes(k)),
  );
  const hasSeafood = allergens.includes("DENIZ_URUNLERI");
  const vegetarian = !hasMeat && !hasSeafood;
  if (!vegetarian) {
    return { vegetarian: false, vegan: false };
  }

  // 2) Vegan = vegetarian + no dairy + no egg + no honey/gelatin
  const hasDairy = allergens.includes("SUT");
  const hasEgg = allergens.includes("YUMURTA");

  // Honey/gelatin, whole-word regex so "bal" does not match "balkabagi"
  // (pumpkin) or "balik" (fish). Any match on any ingredient breaks vegan.
  const hasNonVegan = normalized.some((n) =>
    NON_VEGAN_PATTERNS.some((re) => re.test(n)),
  );

  const vegan = vegetarian && !hasDairy && !hasEgg && !hasNonVegan;
  return { vegetarian, vegan };
}
