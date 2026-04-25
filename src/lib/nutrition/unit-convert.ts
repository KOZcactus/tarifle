/**
 * Amount string -> gram converter (oturum 20, DIET_SCORE_PLAN B* Faz 2).
 *
 * RecipeIngredient.amount free-text String ("1 su bardagi", "500 gr",
 * "2-3 tane", "yarim cay kasigi", "orta boy") gram'a parse eder. Recipe-
 * level nutrition aggregate icin temel.
 *
 * Strateji:
 *   1. Sayisal token cek (regex): "1", "0.5", "1/2", "yarim", "ceyrek",
 *      "bir", "iki", "uc", "dort", "bes", "X-Y" range -> avg
 *   2. Birim token cek: gr/g/gram/kg/ml/litre/su bardagi/yemek kasigi/...
 *   3. Eslesmezse ingredient'a gore varsayilan (gramsPerUnit) veya
 *      "orta boy" -> ingredient density lookup
 *   4. Hicbiri olmazsa null doner (nutrition aggregate atlar)
 *
 * Test: tests/unit/nutrition-unit-convert.test.ts
 */

interface ConvertContext {
  /** Ingredient name, density / orta boy lookup icin */
  ingredientName?: string;
  /** NutritionData.gramsPerUnit, ingredient-spesifik unit (1 yumurta=50g) */
  gramsPerUnit?: number | null;
  /** NutritionData.defaultUnit (g, ml, adet, dis, ...) */
  defaultUnit?: string | null;
}

/** Bilinen birimlerin gram karsilik tablosu. Volume birimler ortalama
 *  yogunlugu gosterir (un = 0.6, sivi = 1.0); ingredient density bilinmiyorsa
 *  default 1.0 (su yogunlugu). */
const VOLUME_TO_ML: Record<string, number> = {
  "su bardagi": 200,
  "su bardağı": 200,
  "cay bardagi": 100,
  "çay bardağı": 100,
  "kahve fincani": 80,
  "kahve fincanı": 80,
  "yemek kasigi": 15,
  "yemek kaşığı": 15,
  "tatli kasigi": 10,
  "tatlı kaşığı": 10,
  "cay kasigi": 5,
  "çay kaşığı": 5,
  "litre": 1000,
  "lt": 1000,
  "l": 1000,
  "ml": 1,
  "cc": 1,
};

const WEIGHT_TO_GRAM: Record<string, number> = {
  "gr": 1,
  "g": 1,
  "gram": 1,
  "kg": 1000,
  "kilo": 1000,
};

/** Sozcuk olarak yazilmis sayilar (ozellikle eski tarif metinlerinde) */
const WORD_NUMBERS: Record<string, number> = {
  "yarim": 0.5,
  "yarım": 0.5,
  "ceyrek": 0.25,
  "çeyrek": 0.25,
  "bir": 1,
  "iki": 2,
  "uc": 3,
  "üç": 3,
  "dort": 4,
  "dört": 4,
  "bes": 5,
  "beş": 5,
  "alti": 6,
  "altı": 6,
  "yedi": 7,
  "sekiz": 8,
  "dokuz": 9,
  "on": 10,
};

/** "Tutam" / "tatli kasigi ucunda" gibi kucuk seasoning miktarlari */
const TINY_AMOUNTS: Record<string, number> = {
  "tutam": 1.5,
  "tutamak": 1.5,
  "fiske": 0.5,
  "uc": 0.5, // "biraz / az / ucunda" wildcard ucu, opsiyonel
};

/** Ingredient-spesifik orta boy gram tablosu, "orta boy domates" gibi */
const MEDIUM_SIZE_GRAMS: Record<string, number> = {
  "domates": 150,
  "soğan": 110,
  "sogan": 110,
  "patates": 173,
  "elma": 180,
  "yumurta": 50,
  "salatalık": 200,
  "salatalik": 200,
  "biber": 75,
  "havuç": 60,
  "havuc": 60,
  "limon": 60,
  "portakal": 130,
};

/**
 * Sayi parse eder, "1", "0.5", "1/2", "1.5", "2-3" (range avg),
 * "yarim", "iki" gibi. Bulamazsa null.
 */
export function parseQuantity(input: string): number | null {
  const s = input.toLowerCase().trim();

  // Range: "2-3" or "2 - 3" -> avg
  const range = s.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)/);
  if (range) {
    const a = parseFloat(range[1]!.replace(",", "."));
    const b = parseFloat(range[2]!.replace(",", "."));
    if (!Number.isNaN(a) && !Number.isNaN(b)) return (a + b) / 2;
  }

  // Fraction: "1/2" -> 0.5
  const frac = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) {
    const n = parseInt(frac[1]!, 10);
    const d = parseInt(frac[2]!, 10);
    if (d > 0) return n / d;
  }

  // Decimal: "1.5", "0,75"
  const num = s.match(/(\d+(?:[.,]\d+)?)/);
  if (num) {
    const v = parseFloat(num[1]!.replace(",", "."));
    if (!Number.isNaN(v)) return v;
  }

  // Word number: "yarim", "iki"
  for (const [word, val] of Object.entries(WORD_NUMBERS)) {
    if (s.includes(word)) return val;
  }

  return null;
}

/**
 * Ana converter. amount string + ingredient context -> gram.
 * Bilemezse null.
 */
export function convertToGrams(
  amountText: string,
  ctx: ConvertContext = {},
): number | null {
  if (!amountText || !amountText.trim()) return null;
  const s = amountText.toLowerCase().trim();

  // Tutam, fiske gibi kucuk seasoning -> sabit
  for (const [unit, grams] of Object.entries(TINY_AMOUNTS)) {
    if (s === unit || s.endsWith(" " + unit)) {
      const qty = parseQuantity(s) ?? 1;
      return qty * grams;
    }
  }

  // "orta boy", "buyuk", "kucuk" + ingredient name lookup
  if (/orta\s+boy|büyük|buyuk|küçük|kucuk/i.test(s)) {
    const ingName = ctx.ingredientName?.toLowerCase() ?? "";
    for (const [n, g] of Object.entries(MEDIUM_SIZE_GRAMS)) {
      if (ingName.includes(n)) {
        const qty = parseQuantity(s) ?? 1;
        const sizeMul = /büyük|buyuk/i.test(s) ? 1.3 : /küçük|kucuk/i.test(s) ? 0.7 : 1;
        return qty * g * sizeMul;
      }
    }
  }

  const quantity = parseQuantity(s) ?? 1;

  // Direct weight: "500 gr", "1 kg"
  for (const [unit, gPerU] of Object.entries(WEIGHT_TO_GRAM)) {
    const re = new RegExp(`\\b${quantity ? "" : ""}\\d*[.,]?\\d*\\s*${unit}\\b`, "i");
    if (re.test(s)) {
      return quantity * gPerU;
    }
  }

  // Volume to ml (then to gram via density default 1.0 or ingredient-specific)
  // Word-boundary kontrol, "l" tek harf "ml" icinde de bulunur, false-positive
  // engelleme. Sirayla en uzun match'i once dene.
  const sortedVolume = Object.entries(VOLUME_TO_ML).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [unit, mlPerU] of sortedVolume) {
    const re = new RegExp(`(^|\\s)${unit.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(\\s|$)`, "i");
    if (re.test(s)) {
      const ml = quantity * mlPerU;
      // Ingredient density: un ~0.6, seker ~0.85, sivi/sut/su 1.0
      const density = inferDensity(ctx.ingredientName);
      return ml * density;
    }
  }

  // Ingredient-specific count unit: "1 adet yumurta", "2 dis sarimsak"
  // TR-aware: ş/s, ı/i, ç/c gibi degiskenleri ASCII-fold ederek karsilastir.
  const sFolded = asciiFold(s);
  if (ctx.gramsPerUnit && ctx.defaultUnit) {
    const unitFolded = asciiFold(ctx.defaultUnit.toLowerCase());
    if (
      sFolded.includes(unitFolded) ||
      sFolded.includes("adet") ||
      sFolded.includes("tane")
    ) {
      return quantity * ctx.gramsPerUnit;
    }
  }

  // "1 adet" / "2 tane" / "1 dis" without context -> use gramsPerUnit if available
  if (/\b(adet|tane|kase|kâse|dis|diş)\b/i.test(sFolded) && ctx.gramsPerUnit) {
    return quantity * ctx.gramsPerUnit;
  }

  // No match
  return null;
}

/** Turkce karakterleri ASCII'ye fold et: ş->s, ı->i, ç->c, vb. Karsilastirma
 *  amacli, gosterim degil. */
export function asciiFold(s: string): string {
  return s
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o");
}

/** Ingredient-spesifik yogunluk (g/ml). Bilinmiyorsa 1.0 (su). */
function inferDensity(ingredientName?: string): number {
  if (!ingredientName) return 1.0;
  const n = ingredientName.toLowerCase();
  if (n.includes("un")) return 0.6;
  if (n.includes("şeker") || n.includes("seker")) return 0.85;
  if (n.includes("tuz")) return 1.2;
  if (n.includes("yağ") || n.includes("yag")) return 0.92;
  if (n.includes("bal")) return 1.42;
  if (n.includes("ceviz") || n.includes("badem") || n.includes("findik") || n.includes("fındık")) return 0.55;
  return 1.0; // varsayilan: sivi yogunlugu
}
