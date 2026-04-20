/**
 * TR-aware fuzzy string matching helpers.
 *
 * Tarifle arama akışında kullanılır:
 *  - AI matcher 3. adım (direct prefix → synonym → fuzzy fallback)
 *  - Pantry staple check, "kerik" yazan kullanıcı "kekik" ile eşleşsin
 *  - Recipe title arama, "domatez corbasi" → "domates çorbası" bulunur
 *
 * Strateji: klasik Levenshtein DP, TR karakterler ASCII'ye indirgenip
 * karşılaştırılır. Bu sayede "ş"/"s", "ğ"/"g" gibi klavye yazım
 * kaymaları ekstra distance yaratmaz. Distance eşiği kelime uzunluğuna
 * göre dinamik, kısa kelimeler ("et", "su") yanlış pozitif yaratmasın.
 */

/**
 * Türkçe karakterleri ASCII muadillerine indirger. Case-insensitive
 * karşılaştırma için caller önce lower case yapmalı.
 *
 * Özel eşlemeler:
 *  - ı/i → i ; İ/I → i (tr locale zaten i'ye indirir, ama ı explicit)
 *  - ş → s, ğ → g, ü → u, ö → o, ç → c
 *
 * "domates" vs "domatez" gibi durumlarda normalize tek başına yetmez;
 * levenshteinDistance ile birleştirilir.
 */
export function asciiNormalize(input: string): string {
  return input
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u");
}

/**
 * Klasik Levenshtein edit distance DP. O(m*n) zaman, O(min(m,n)) alan
 * (two-row rolling array optimization). Küçük string'lerde (typical
 * ingredient adı <30 char) sorunsuz.
 *
 * Tek karakterlik ekleme/silme/değiştirme = 1 maliyet. Transposition
 * (harf takası) Damerau varyantında özel, biz kullanmıyoruz, klasik
 * Levenshtein zaten çoğu typo'yu 1-2 distance ile yakalar.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Rolling rows, sadece previous + current tutulur.
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

/**
 * Fuzzy match eşik kuralı.
 *
 * Kısa string'lerde (≤4 char) distance 1 bile anlamsal farktır, "et"
 * vs "at" farklı kelimeler, tolere etmiyoruz.
 *
 * Orta (5-7 char): 1 edit toleransı (bir harf eksik/yanlış/taşmış).
 * Uzun (8+ char): 2 edit toleransı, "profiterol" vs "profiteroll" OK.
 */
function allowedDistance(len: number): number {
  if (len <= 4) return 0;
  if (len <= 7) return 1;
  return 2;
}

export interface FuzzyOptions {
  /** Explicit override; otherwise length-based rule uygulanır. */
  maxDistance?: number;
  /** Eğer true (default) ASCII normalize edilir. */
  normalize?: boolean;
}

/**
 * İki string'in fuzzy eşleşip eşleşmediğini döner. Default davranış:
 *   - ASCII normalize (TR → Latin)
 *   - Length-aware distance threshold
 *
 * Exact match, prefix match, substring match değildir, sadece edit
 * distance. Caller kendi stratejisinde prefix/substring'i ayrı dener.
 */
export function fuzzyMatches(
  a: string,
  b: string,
  options: FuzzyOptions = {},
): boolean {
  const { normalize = true, maxDistance } = options;
  const x = normalize ? asciiNormalize(a) : a;
  const y = normalize ? asciiNormalize(b) : b;

  if (x === y) return true;

  const maxLen = Math.max(x.length, y.length);
  const threshold = maxDistance ?? allowedDistance(maxLen);
  if (threshold === 0) return false;

  // Optimization: length farkı threshold'u aşıyorsa zaten uzak, hesapla.
  if (Math.abs(x.length - y.length) > threshold) return false;

  return levenshteinDistance(x, y) <= threshold;
}

/**
 * Token-level fuzzy: her user token en az bir recipe token ile fuzzy
 * eşleşiyor mu? AI matcher'da direct prefix ve synonym başarısız olursa
 * son savunma hattı. Her iki tarafın tokenları önceden ayrılmış olmalı.
 */
export function tokensFuzzyMatch(
  recipeTokens: readonly string[],
  userTokens: readonly string[],
  options: FuzzyOptions = {},
): boolean {
  if (userTokens.length === 0 || recipeTokens.length === 0) return false;
  return userTokens.every((ut) =>
    recipeTokens.some((rt) => fuzzyMatches(ut, rt, options)),
  );
}
