/**
 * Turkish-aware ingredient matching utilities.
 */

import { fuzzyMatches } from "@/lib/fuzzy";

/**
 * Pantry staples — **gerçek salt-and-pepper seviyesinde** baharat + su +
 * yağ. Matcher bu kelimeleri "zaten var" varsayarak skorlar.
 *
 * v3 (19 Nis 2026) — daraltma + exact-phrase match:
 *
 * v2'de liste aşırı genişti (un/şeker/maya/sirke/limon suyu/tereyağı/
 * maydanoz/kekik dahildi). Sonuç: "limon suyu" pantry sayılınca
 * tokenization bug'ıyla `limon` tek başına da pantry gibi davranıyordu
 * ve **limonata %100 match** görünüyordu — kullanıcı sadece domates
 * girmişken. Keza un pantry sayılınca ekmek/börek/çörek çok kolay
 * %100'e ulaşıyordu, gerçek sinyal kayboluyordu.
 *
 * v3 filozofisi: pantry = "pratikte her tarife tuz-biber-yağ eşlesmesi
 * olarak yazılan, ana malzeme kimliği taşımayan şeyler". Un ≠ pantry
 * (ekmek/börek'in ANA malzemesi). Şeker ≠ pantry (tatlının ANA
 * malzemesi). Tereyağı ≠ pantry (kahvaltı sabitleri vs. standart pişirme
 * yağı dengesiz — opt-in bırak).
 *
 * Ayrıca `isPantryStaple` artık **exact normalized phrase match** yapar:
 * `"limon"` tek başına pantry değildir çünkü listede `"limon"` yok
 * (sadece `"limon suyu"` var ki o da v3'te çıkarıldı).
 */
const PANTRY_STAPLES: ReadonlySet<string> = new Set(
  [
    "tuz",
    "karabiber",
    "biber",
    "pul biber",
    "su",
    "yağ",
    "sıvı yağ",
    "sıvıyağ",
    "zeytinyağı",
    "ayçiçek yağı",
    "kekik",
    "kimyon",
    "nane",
  ].map((s) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim()),
);

/**
 * Synonym / alias map. Turkish ingredient synonyms that should match
 * each other. Each group of synonyms maps bidirectionally.
 * Format: primary → alternatives[]. `ingredientMatches` checks synonyms
 * when the direct prefix match fails.
 *
 * v2 (17 Nis 2026): 10 → 45 grup. Türk mutfağı kapsamı için eklenenler:
 *   - Et ayrıştırıldı: et (parça), kıyma, tavuk göğsü, tavuk budu ayrı
 *     gruplar (önceden "dana eti = kıyma" false-positive'i vardı)
 *   - Balık, karides, mantar, yoğurt, süt, tereyağı, zeytinyağı, bitkisel
 *     yağ, otlar, sebzeler, baklagil, tahıl, un/nişasta, bal/sirke/limon,
 *     soslar, lahana/ıspanak
 *
 * Grup ekleme kuralı: iki ingredient'ın BİRBİRİNİN YERİNE ikame
 * edilebilmesi gerek. "Beyaz peynir ↔ kaşar" OK (ikisi de peynir) ama
 * "Tavuk ↔ balık" DEĞİL (protein farklı). Başka deyişle: "elimde A var,
 * tarif B istiyor — yapabilir miyim?" sorusunun cevabı evet olmalı.
 */
const SYNONYM_GROUPS: readonly string[][] = [
  // ─── Et & Balık ────────────────────────────────────────
  ["et", "dana eti", "kuzu eti", "biftek", "bonfile"],
  ["kıyma", "dana kıyma", "kuzu kıyma", "karışık kıyma"],
  ["tavuk", "piliç"],
  ["tavuk göğsü", "piliç göğsü", "tavuk göğüs"],
  ["tavuk budu", "piliç budu"],
  ["tavuk kıyma", "piliç kıyma"],
  ["balık", "somon", "levrek", "çipura", "alabalık", "hamsi", "sardalya", "ton balığı", "uskumru"],
  ["karides", "jumbo karides"],

  // ─── Süt ürünleri & Yağlar ─────────────────────────────
  ["yoğurt", "süzme yoğurt", "çoban yoğurt", "tam yağlı yoğurt"],
  ["süt", "tam yağlı süt", "yarım yağlı süt", "az yağlı süt"],
  ["peynir", "beyaz peynir", "kaşar", "kaşar peyniri", "ezine peyniri"],
  ["tereyağı", "sade yağ"],
  ["krema", "sıvı krema", "krema şanti"],
  ["zeytinyağı", "sızma zeytinyağı", "erken hasat zeytinyağı"],
  ["ayçiçek yağı", "mısır özü yağı", "kanola yağı", "bitkisel yağ"],

  // ─── Sebze ──────────────────────────────────────────────
  ["biber", "sivri biber", "çarliston biber", "dolmalık biber", "kapya biber"],
  ["domates", "çeri domates", "salkım domates"],
  ["soğan", "kuru soğan", "arpacık soğan"],
  ["yeşil soğan", "taze soğan"],
  ["sarımsak", "sarımsak dişi"],
  ["patates", "haşlanmış patates", "fırınlık patates"],
  ["patlıcan", "kemer patlıcan"],
  ["kabak", "sakız kabağı", "çağla kabak"],
  ["havuç", "rende havuç"],
  ["salatalık", "taze salatalık"],
  ["marul", "göbek marul", "iceberg marul", "kıvırcık marul"],
  ["pırasa", "taze pırasa"],
  ["ıspanak", "taze ıspanak", "dondurulmuş ıspanak"],
  ["lahana", "beyaz lahana", "kırmızı lahana", "kara lahana"],
  ["mantar", "kültür mantarı", "istiridye mantarı", "porçini"],

  // ─── Otlar ──────────────────────────────────────────────
  ["maydanoz", "yaprak maydanoz", "ince maydanoz"],
  ["dereotu", "taze dereotu"],
  ["reyhan", "fesleğen"],

  // ─── Baklagil & Tahıl ──────────────────────────────────
  ["pirinç", "baldo pirinç", "basmati", "jasmine", "osmancık pirinç"],
  ["bulgur", "pilavlık bulgur", "köftelik bulgur", "ince bulgur"],
  ["makarna", "spagetti", "penne", "fusilli", "fettuccine"],
  ["mercimek", "kırmızı mercimek", "yeşil mercimek", "sarı mercimek"],
  ["nohut", "haşlanmış nohut", "konserve nohut"],
  ["kuru fasulye", "beyaz fasulye"],
  ["yeşil fasulye", "ayşe kadın fasulye", "çalı fasulyesi"],

  // ─── Un & Nişasta ──────────────────────────────────────
  ["un", "buğday unu", "tam buğday unu"],
  ["nişasta", "buğday nişastası", "mısır nişastası"],

  // ─── Tatlı, ekşi, sos ──────────────────────────────────
  ["şeker", "toz şeker", "esmer şeker", "pudra şeker"],
  ["bal", "süzme bal", "çam balı", "çiçek balı"],
  ["limon", "limon suyu", "taze limon"],
  ["sirke", "elma sirkesi", "beyaz sirke", "balzamik sirke", "üzüm sirkesi"],
  ["salça", "domates salçası", "biber salçası"],
  ["soya sosu", "light soya sosu"],
  ["maya", "kuru maya", "instant maya", "yaş maya"],
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

  // Fuzzy fallback — kullanıcı typo yapmış olabilir ("domatez" → "domates",
  // "kerik" → "kekik"). Token başına ASCII-normalize + length-aware
  // Levenshtein distance (≤4 char exact-only, 5-7 = 1 edit, 8+ = 2 edit).
  // En pahalı adım bu (O(m*n) per token pair), en sona konduğu için
  // sadece direct + synonym miss olunca çalışır.
  const fuzzyMatch = userTokens.every((ut) =>
    recipeTokens.some((rt) => fuzzyMatches(ut, rt)),
  );
  if (fuzzyMatch) return true;

  return false;
}

/**
 * Exact-phrase pantry check — v3. Önceki token-set yaklaşımı `"limon"`
 * tek token'ını pantry sayıyordu çünkü `"limon suyu"` pantry olduğunda
 * tokens `[limon, suyu]` set'e giriyordu. Şimdi **normalize edilmiş tam
 * ingredient string** PANTRY_STAPLES set'inde mi, dümdüz karşılaştırılır.
 *
 * Edge case — compound form: "sıvı yağ" (pantry) vs "sıvı yağ, yarım
 * kaşık" gibi input. Normalize zaten parenthetical strip + whitespace
 * collapse yapıyor, exact match için yeterli. Fuzzy match pantry'ye
 * sıçramaz.
 */
export function isPantryStaple(ingredient: string): boolean {
  const normalized = normalizeIngredient(ingredient);
  if (normalized.length === 0) return false;
  return PANTRY_STAPLES.has(normalized);
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
