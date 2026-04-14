/**
 * Temel Türkçe argo/küfür blacklist filtresi.
 * Kelimeler normalize edilip kontrol ediliyor (büyük/küçük harf, Türkçe karakter).
 * Bu liste genişletilebilir veya ileride DB'den çekilebilir.
 */

const BLACKLIST: string[] = [
  // Yaygın Türkçe argo/küfürler (kısaltma ve varyasyonlarıyla)
  "amk",
  "aq",
  "mk",
  "sg",
  "sktir",
  "orospu",
  "piç",
  "göt",
  "sik",
  "yarrak",
  "taşak",
  "am",
  "meme",
  "kaltak",
  "pezevenk",
  "ibne",
  "gavat",
  "dangalak",
  "gerizekalı",
  "salak",
  "aptal",
  "mal",
  "geri zekalı",
  "hıyar",
  "s2m",
  "bok",
  "lan",
];

/** Türkçe karakterleri ASCII'ye normalize eder */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export interface BlacklistResult {
  isClean: boolean;
  flaggedWords: string[];
}

/** Verilen metni blacklist'e karşı kontrol eder */
export function checkBlacklist(text: string): BlacklistResult {
  const normalized = normalize(text);
  const words = normalized.split(/\s+/);
  const flaggedWords: string[] = [];

  for (const word of words) {
    if (BLACKLIST.includes(word)) {
      flaggedWords.push(word);
    }
  }

  // Çok kelimelik ifadeleri de kontrol et
  for (const phrase of BLACKLIST) {
    if (phrase.includes(" ") && normalized.includes(phrase)) {
      flaggedWords.push(phrase);
    }
  }

  return {
    isClean: flaggedWords.length === 0,
    flaggedWords: [...new Set(flaggedWords)],
  };
}

/** Birden fazla metni tek seferde kontrol eder */
export function checkMultipleTexts(texts: string[]): BlacklistResult {
  const allFlagged: string[] = [];

  for (const text of texts) {
    const result = checkBlacklist(text);
    allFlagged.push(...result.flaggedWords);
  }

  const unique = [...new Set(allFlagged)];
  return {
    isClean: unique.length === 0,
    flaggedWords: unique,
  };
}
