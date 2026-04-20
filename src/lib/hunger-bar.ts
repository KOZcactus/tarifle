/**
 * Hunger bar, Minecraft-esin tokluk göstergesi. Her tarif için 1-10
 * arası bir "tokluk puanı" hesaplar. Kullanıcı açlık bar'ı ile tarif
 * seçimi yaparken (özellikle "çok açım, doyurucu bir şey lazım") yararlı.
 *
 * Bilimsel temel: Holt Satiety Index (1995). Tokluk kalori değil,
 * protein + fiber + slow carb dominant; saf şeker + yağ hızlı acıktırır.
 *
 * Birim: Porsiyon başı. DB'deki `averageCalories`, `protein`, `carbs`,
 * `fat` zaten per-serving saklanır. Ingredient listesi fiber
 * proxy için kullanılır (fiber alanı DB'de yok, keyword match ile
 * legume / whole-grain / veg bulk tahmin edilir).
 *
 * Skala: Integer 1-10. Half-step yok (bilinçli sade tutuldu; formül
 * zaten orta-yüksek kümeleniyorsa sonraki iterasyonda Decimal'a geçilir).
 *
 * UI: <HungerBar value={n} /> component. Filled 🍖 × n + empty 🦴 × (10-n).
 */

export const HUNGER_BAR_MIN = 1;
export const HUNGER_BAR_MAX = 10;

/** Kategoriye göre tokluk başlangıç puanı (float). Büyük yemek 5.5,
 *  içecek 0.5 etc. Formula geri kalanını üstüne ekler. */
const CATEGORY_BASE: Record<string, number> = {
  "et-yemekleri": 5.5,
  "tavuk-yemekleri": 5.0,
  "baklagil-yemekleri": 5.5,
  "sebze-yemekleri": 3.5,
  "makarna-pilav": 4.0,
  "hamur-isleri": 3.5,
  "kahvaltiliklar": 4.5,
  "corbalar": 3.5,
  "salatalar": 2.5,
  "aperatifler": 2.0,
  "atistirmaliklar": 2.0,
  "tatlilar": 2.0,
  "smoothie-shake": 2.5,
  "kahve-sicak-icecekler": 0.5,
  "kokteyller": 1.0,
  "icecekler": 0.5,
  "soslar-dippler": 0.5,
};

/** Fiber proxy, ingredient name'de geçerse tokluk bonus'u. Turkish
 *  normalize (ğ→g, ş→s, ı→i vs) tüketici tarafında uygulanır. */
const LEGUME_TOKENS = [
  "mercimek",
  "nohut",
  "fasulye",
  "barbunya",
  "bezelye",
  "borulce",
  "leblebi",
];
const WHOLE_GRAIN_TOKENS = [
  "bulgur",
  "yulaf",
  "cavdar",
  "karabugday",
  "firik",
  "kinoa",
  "tam bugday",
  "tam tahil",
];
const VEGETABLE_BULK_TOKENS = [
  "brokoli",
  "karnabahar",
  "lahana",
  "ispanak",
  "pazi",
  "kabak",
  "patlican",
  "patates",
  "havuc",
  "pirasa",
];

/** Turkish-aware ASCII fold, keyword substring match için. */
function trNormalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

function hasAnyToken(text: string, tokens: readonly string[]): boolean {
  const normalized = trNormalize(text);
  return tokens.some((t) => normalized.includes(t));
}

export interface HungerBarInput {
  /** Kategori slug'ı (`et-yemekleri`, `corbalar`, etc). */
  categorySlug: string;
  /** Tarif tipi enum değeri (`YEMEK`, `TATLI`, `ICECEK`, etc). */
  type: string;
  /** Porsiyon başı kalori. Decimal/Number cast DB tarafında. */
  averageCalories: number | null;
  /** Porsiyon başı protein (gram). */
  protein: number | null;
  /** Porsiyon başı karbonhidrat (gram). */
  carbs: number | null;
  /** Porsiyon başı yağ (gram). */
  fat: number | null;
  /** Ingredient isimleri listesi (fiber proxy için). */
  ingredientNames: readonly string[];
}

export interface HungerBarBreakdown {
  final: number;
  base: number;
  proteinBonus: number;
  fatBonus: number;
  carbsBonus: number;
  legumeBonus: number;
  grainBonus: number;
  vegBonus: number;
  dessertPenalty: number;
  liquidMultiplier: number;
  raw: number;
}

/**
 * Açlık bar puanını hesaplar (1-10 integer).
 *
 * Formül:
 *   base (kategori)
 *   + protein/15  (15g = +1, 30g = +2)
 *   + fat/40      (20g = +0.5, 40g = +1)
 *   + carbs bonus (TATLI değilse /60, TATLI ise /120 * 0.5)
 *   + legume +1 (mercimek/nohut/fasulye/...)
 *   + grain +0.5 (bulgur/yulaf/çavdar/...)
 *   + veg bulk +0.3 (patlıcan/patates/havuç/...)
 *   - TATLI -1 penalty
 *   * 0.8 ICECEK/KOKTEYL liquid multiplier
 *   clamp(1, 10), round nearest integer
 */
export function calcHungerBar(input: HungerBarInput): number {
  return calcHungerBarWithBreakdown(input).final;
}

export function calcHungerBarWithBreakdown(
  input: HungerBarInput,
): HungerBarBreakdown {
  const base = CATEGORY_BASE[input.categorySlug] ?? 3.0;

  const protein = input.protein ?? 0;
  const fat = input.fat ?? 0;
  const carbs = input.carbs ?? 0;

  const proteinBonus = protein / 15;
  const fatBonus = fat / 40;

  const carbsBonus =
    input.type === "TATLI" ? (carbs / 120) * 0.5 : carbs / 60;

  const joinedIngredients = input.ingredientNames.join(" ");
  const legumeBonus = hasAnyToken(joinedIngredients, LEGUME_TOKENS) ? 1.0 : 0;
  const grainBonus = hasAnyToken(joinedIngredients, WHOLE_GRAIN_TOKENS)
    ? 0.5
    : 0;
  const vegBonus = hasAnyToken(joinedIngredients, VEGETABLE_BULK_TOKENS)
    ? 0.3
    : 0;

  const dessertPenalty = input.type === "TATLI" ? -1.0 : 0;

  const subtotal =
    base +
    proteinBonus +
    fatBonus +
    carbsBonus +
    legumeBonus +
    grainBonus +
    vegBonus +
    dessertPenalty;

  const liquidMultiplier =
    input.type === "ICECEK" || input.type === "KOKTEYL" ? 0.8 : 1.0;

  const raw = subtotal * liquidMultiplier;
  const final = Math.max(
    HUNGER_BAR_MIN,
    Math.min(HUNGER_BAR_MAX, Math.round(raw)),
  );

  return {
    final,
    base,
    proteinBonus,
    fatBonus,
    carbsBonus,
    legumeBonus,
    grainBonus,
    vegBonus,
    dessertPenalty,
    liquidMultiplier,
    raw,
  };
}

/** UI-friendly kısa açıklama (hover tooltip için).  */
export function hungerBarLabel(value: number, locale: "tr" | "en" | "de" = "tr"): string {
  const capped = Math.max(1, Math.min(10, Math.round(value)));
  const bucket = capped <= 2 ? "low" : capped <= 5 ? "mid" : capped <= 8 ? "high" : "max";
  const labels: Record<string, Record<string, string>> = {
    tr: {
      low: "Az tok tutar",
      mid: "Orta tok tutar",
      high: "Çok tok tutar",
      max: "Uzun süre tok tutar",
    },
    en: {
      low: "Light satiety",
      mid: "Moderate satiety",
      high: "Strong satiety",
      max: "Very filling",
    },
    de: {
      low: "Wenig sättigend",
      mid: "Mittelsättigend",
      high: "Stark sättigend",
      max: "Sehr sättigend",
    },
  };
  return `${capped}/10, ${labels[locale][bucket]}`;
}
