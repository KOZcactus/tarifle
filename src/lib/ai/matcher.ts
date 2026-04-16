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
  "ayçiçek yağı",
  "şeker",
  "un",
  "biber",
  "pul biber",
  "kekik",
  "kimyon",
  "nane",
];

/**
 * Synonym / alias map. Turkish ingredient synonyms that should match
 * each other. Each group of synonyms maps bidirectionally.
 * Format: primary → alternatives[]. `ingredientMatches` checks synonyms
 * when the direct prefix match fails.
 */
const SYNONYM_GROUPS: readonly string[][] = [
  ["tavuk", "piliç"],
  ["biber", "sivri biber", "çarliston biber", "dolmalık biber"],
  ["domates", "çeri domates", "salkım domates"],
  ["soğan", "kuru soğan", "arpacık soğan"],
  ["sarımsak", "sarımsak dişi"],
  ["peynir", "beyaz peynir", "kaşar", "kaşar peyniri"],
  ["krema", "sıvı krema", "krema şanti"],
  ["makarna", "spagetti", "penne", "fusilli"],
  ["pirinç", "baldo pirinç", "basmati", "jasmine"],
  ["et", "dana eti", "kuzu eti", "kıyma", "dana kıyma"],
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
 * Build a synonym lookup: for each term, return all equivalent terms.
 * Precomputed once at module load.
 */
const SYNONYM_MAP: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    const normalized = group.map(normalizeIngredient);
    for (const term of normalized) {
      const others = normalized.filter((t) => t !== term);
      const existing = map.get(term) ?? [];
      map.set(term, [...existing, ...others]);
    }
  }
  return map;
})();

/**
 * Get synonym alternatives for a normalized ingredient.
 */
function getSynonyms(normalized: string): readonly string[] {
  // Exact match
  const direct = SYNONYM_MAP.get(normalized);
  if (direct) return direct;
  // Check if any synonym key is a prefix of the normalized ingredient
  for (const [key, synonyms] of SYNONYM_MAP) {
    if (normalized.startsWith(key) || key.startsWith(normalized)) {
      return synonyms;
    }
  }
  return [];
}

/**
 * Does `recipeIng` contain any token that starts with any user token?
 *
 * Word-prefix matching (not substring) avoids false positives like "limon"
 * matching "helimonik". "domates" will match both "domates" and "çeri domates".
 */
export function ingredientMatches(recipeIng: string, userIng: string): boolean {
  const recipeNorm = normalizeIngredient(recipeIng);
  const userNorm = normalizeIngredient(userIng);
  const recipeTokens = tokens(recipeNorm);
  const userTokens = tokens(userNorm);
  if (userTokens.length === 0 || recipeTokens.length === 0) return false;

  // Direct prefix match — every user token must hit some recipe token.
  const directMatch = userTokens.every((ut) =>
    recipeTokens.some(
      (rt) => rt.startsWith(ut) || ut.startsWith(rt),
    ),
  );
  if (directMatch) return true;

  // Synonym fallback — check if user ingredient is a synonym of recipe ingredient.
  // "piliç" should match a recipe that says "tavuk göğsü".
  const userSynonyms = getSynonyms(userNorm);
  for (const syn of userSynonyms) {
    const synTokens = tokens(syn);
    const synMatch = synTokens.every((st) =>
      recipeTokens.some(
        (rt) => rt.startsWith(st) || st.startsWith(rt),
      ),
    );
    if (synMatch) return true;
  }

  return false;
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
