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

export function isPantryStaple(ingredient: string): boolean {
  const norm = normalizeIngredient(ingredient);
  return PANTRY_STAPLES.some((s) => ingredientMatches(norm, s));
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
