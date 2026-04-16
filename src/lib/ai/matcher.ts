/**
 * Turkish-aware ingredient matching utilities.
 */

const PANTRY_STAPLES = [
  "tuz",
  "karabiber",
  "su",
  "sıvı yağ",
  "zeytinyağı",
  "sıvıyağ",
  "yağ",
];

/**
 * Normalise an ingredient name for comparison:
 *  - Turkish-aware lowercasing (i/İ + ı/I pairs)
 *  - strip parenthetical modifiers
 *  - trim whitespace
 *  - collapse internal whitespace
 */
export function normalizeIngredient(raw: string): string {
  return raw
    .toLocaleLowerCase("tr")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenise by whitespace and commas — keeps multi-word names like "ay çiçek yağı"
 * as separate tokens so we can do word-level matching without over-fitting.
 */
function tokens(normalized: string): string[] {
  return normalized.split(/[\s,]+/).filter(Boolean);
}

/**
 * Does `recipeIng` contain any token that starts with any user token?
 *
 * Word-prefix matching (not substring) avoids false positives like "limon"
 * matching "helimonik". "domates" will match both "domates" and "çeri domates".
 */
export function ingredientMatches(recipeIng: string, userIng: string): boolean {
  const recipeTokens = tokens(normalizeIngredient(recipeIng));
  const userTokens = tokens(normalizeIngredient(userIng));
  if (userTokens.length === 0 || recipeTokens.length === 0) return false;

  // Every user token must hit SOME recipe token (prefix match). This lets
  // "zeytin yağı" match "zeytinyağı" / "zeytin yağı" but not "zeytin".
  return userTokens.every((ut) =>
    recipeTokens.some(
      (rt) => rt.startsWith(ut) || ut.startsWith(rt),
    ),
  );
}

/**
 * Precomputed set of every token that appears in any pantry staple name.
 * Used for pantry detection: a recipe ingredient qualifies ONLY if every
 * one of its tokens is itself a pantry token. Avoids the prefix-matching
 * false positive where "sucuk" was treated as "su" (water) because
 * `ingredientMatches("sucuk","su")` returned true via bidirectional
 * prefix — that logic is fine for user-vs-recipe matching but wrong for
 * staple identity, which needs exact-token containment.
 */
const PANTRY_TOKEN_SET: ReadonlySet<string> = new Set(
  PANTRY_STAPLES.flatMap((s) => tokens(normalizeIngredient(s))),
);

export function isPantryStaple(ingredient: string): boolean {
  const recipeTokens = tokens(normalizeIngredient(ingredient));
  if (recipeTokens.length === 0) return false;
  // Every token in the recipe ingredient must itself be a pantry token.
  // "tuz, karabiber" → [tuz, karabiber] both pantry → staple ✓
  // "sıvı yağ" → [sıvı, yağ] both pantry → staple ✓
  // "sucuk" → [sucuk] NOT pantry → not staple ✓
  // "su kabağı" → [su, kabağı] "kabağı" not pantry → not staple ✓
  return recipeTokens.every((t) => PANTRY_TOKEN_SET.has(t));
}

/**
 * Check if a recipe contains any of the excluded ingredients.
 * Uses the same `ingredientMatches` logic as the main matcher.
 * Returns true if the recipe should be EXCLUDED (disqualified).
 */
export function recipeContainsExcluded(
  recipeIngredients: readonly { name: string }[],
  excludeIngredients: readonly string[],
): boolean {
  if (excludeIngredients.length === 0) return false;
  const excludeNorm = excludeIngredients.map(normalizeIngredient).filter(Boolean);
  return recipeIngredients.some((ri) =>
    excludeNorm.some((ex) => ingredientMatches(ri.name, ex)),
  );
}

export interface MatchResult {
  matched: string[];
  missing: string[];
  score: number;
}

export function computeMatch(
  recipeIngredients: { name: string; isOptional: boolean }[],
  userIngredients: string[],
  opts: { assumePantryStaples?: boolean } = {},
): MatchResult {
  const userList = userIngredients.map(normalizeIngredient).filter(Boolean);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const ing of recipeIngredients) {
    // Optional ingredients don't hurt the score when missing.
    if (ing.isOptional) {
      if (userList.some((u) => ingredientMatches(ing.name, u))) {
        matched.push(ing.name);
      }
      continue;
    }

    if (opts.assumePantryStaples && isPantryStaple(ing.name)) {
      matched.push(ing.name);
      continue;
    }

    if (userList.some((u) => ingredientMatches(ing.name, u))) {
      matched.push(ing.name);
    } else {
      missing.push(ing.name);
    }
  }

  const required = recipeIngredients.filter((i) => !i.isOptional).length;
  const matchedRequired = matched.filter((name) =>
    recipeIngredients.find((i) => i.name === name && !i.isOptional),
  ).length;

  const score = required === 0 ? 0 : matchedRequired / required;

  return { matched, missing, score };
}
