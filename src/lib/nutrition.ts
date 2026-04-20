/**
 * Rule-based nutrition estimation for Turkish & international recipes.
 *
 * Estimates averageCalories, protein, carbs, fat per serving from
 * ingredient names + amounts + units + serving count. NOT a precision
 * nutrition calculator, it's a "good enough" approximation for
 * recipe cards, comparable to what a food blog would display.
 *
 * Accuracy target: ±20% of actual. Some ingredient names are ambiguous
 * ("sos" could be anything), unknown ingredients are skipped, which
 * biases estimates slightly low. Better low than fabricated.
 *
 * Used by `scripts/retrofit-nutrition.ts` for bulk backfill and
 * validated against the 106 recipes that already have manual values.
 */

// ─── Nutrient database (per 100g) ───────────────────────────
// Sources: USDA FoodData Central, Türk Gıda Kompozisyon Veritabanı (TÜBİTAK)
// Only commonly used ingredients in the 706 recipe corpus.

interface NutrientPer100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DB: Record<string, NutrientPer100g> = {
  // ── Etler ──
  "dana kıyma": { kcal: 250, protein: 17, carbs: 0, fat: 20 },
  "dana eti": { kcal: 250, protein: 26, carbs: 0, fat: 15 },
  "dana bonfile": { kcal: 218, protein: 26, carbs: 0, fat: 12 },
  "dana antrikot": { kcal: 250, protein: 25, carbs: 0, fat: 17 },
  "dana incik": { kcal: 200, protein: 27, carbs: 0, fat: 10 },
  "dana pirzola": { kcal: 250, protein: 25, carbs: 0, fat: 17 },
  "dana ciğeri": { kcal: 135, protein: 20, carbs: 4, fat: 4 },
  "dana kaburga": { kcal: 260, protein: 24, carbs: 0, fat: 18 },
  "kuzu eti": { kcal: 280, protein: 25, carbs: 0, fat: 20 },
  "kuşbaşı kuzu eti": { kcal: 280, protein: 25, carbs: 0, fat: 20 },
  "kuzu kuşbaşı": { kcal: 280, protein: 25, carbs: 0, fat: 20 },
  "kemikli kuzu eti": { kcal: 240, protein: 22, carbs: 0, fat: 17 },
  "domuz bonfile": { kcal: 240, protein: 27, carbs: 0, fat: 14 },
  "kuyruk yağı": { kcal: 900, protein: 0, carbs: 0, fat: 100 },
  "sucuk": { kcal: 450, protein: 18, carbs: 2, fat: 42 },
  "pastırma": { kcal: 200, protein: 30, carbs: 1, fat: 8 },

  // ── Tavuk ──
  "tavuk göğsü": { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  "tavuk but": { kcal: 209, protein: 26, carbs: 0, fat: 11 },
  "tavuk but eti": { kcal: 209, protein: 26, carbs: 0, fat: 11 },
  "tavuk kalça": { kcal: 209, protein: 26, carbs: 0, fat: 11 },
  "tavuk kanat": { kcal: 203, protein: 30, carbs: 0, fat: 8 },

  // ── Deniz ürünleri ──
  "somon": { kcal: 208, protein: 20, carbs: 0, fat: 13 },
  "somon fileto": { kcal: 208, protein: 20, carbs: 0, fat: 13 },
  "hamsi": { kcal: 131, protein: 20, carbs: 0, fat: 5 },
  "karides": { kcal: 99, protein: 24, carbs: 0, fat: 0.3 },
  "balık fileto": { kcal: 150, protein: 22, carbs: 0, fat: 7 },
  "levrek fileto": { kcal: 124, protein: 24, carbs: 0, fat: 2.5 },
  "ahtapot": { kcal: 82, protein: 15, carbs: 2, fat: 1 },

  // ── Süt ürünleri ──
  "süt": { kcal: 60, protein: 3.2, carbs: 5, fat: 3.2 },
  "yoğurt": { kcal: 60, protein: 3.5, carbs: 4, fat: 3.3 },
  "süzme yoğurt": { kcal: 90, protein: 5, carbs: 3, fat: 6 },
  "tereyağı": { kcal: 717, protein: 0.9, carbs: 0, fat: 81 },
  "krema": { kcal: 340, protein: 2, carbs: 3, fat: 36 },
  "kaymak": { kcal: 300, protein: 2, carbs: 3, fat: 30 },
  "peynir": { kcal: 350, protein: 25, carbs: 1, fat: 27 },
  "kaşar peyniri": { kcal: 370, protein: 28, carbs: 1, fat: 28 },
  "beyaz peynir": { kcal: 264, protein: 17, carbs: 0, fat: 21 },
  "lor peyniri": { kcal: 100, protein: 12, carbs: 3, fat: 4 },
  "mozzarella": { kcal: 280, protein: 28, carbs: 3, fat: 17 },
  "parmesan": { kcal: 420, protein: 38, carbs: 4, fat: 29 },

  // ── Yumurta ──
  "yumurta": { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  "yumurta sarısı": { kcal: 322, protein: 16, carbs: 4, fat: 27 },

  // ── Tahıllar ──
  "un": { kcal: 364, protein: 10, carbs: 76, fat: 1 },
  "pirinç": { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "bulgur": { kcal: 342, protein: 12, carbs: 76, fat: 1.3 },
  "makarna": { kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
  "spagetti": { kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
  "pirinç eriştesi": { kcal: 109, protein: 0.9, carbs: 25, fat: 0.2 },
  "ekmek": { kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
  "pide": { kcal: 280, protein: 8, carbs: 50, fat: 5 },
  "yufka": { kcal: 310, protein: 8, carbs: 60, fat: 4 },
  "kadayıf": { kcal: 310, protein: 6, carbs: 58, fat: 5 },
  "tortilla": { kcal: 312, protein: 8, carbs: 50, fat: 8 },
  "mısır nişastası": { kcal: 381, protein: 0.3, carbs: 91, fat: 0 },
  "ekmek kırıntısı": { kcal: 395, protein: 13, carbs: 72, fat: 5 },
  "pirinç unu": { kcal: 366, protein: 6, carbs: 80, fat: 1.4 },
  "kırık pirinç": { kcal: 360, protein: 7, carbs: 80, fat: 0.5 },

  // ── Baklagiller ──
  "kırmızı mercimek": { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  "yeşil mercimek": { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  "nohut": { kcal: 164, protein: 9, carbs: 27, fat: 2.6 },
  "kuru fasulye": { kcal: 127, protein: 9, carbs: 23, fat: 0.5 },
  "beyaz fasulye": { kcal: 127, protein: 9, carbs: 23, fat: 0.5 },
  "siyah fasulye": { kcal: 132, protein: 9, carbs: 24, fat: 0.5 },
  "barbunya": { kcal: 127, protein: 9, carbs: 23, fat: 0.5 },

  // ── Sebzeler ──
  "soğan": { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  "sarımsak": { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  "domates": { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  "biber": { kcal: 31, protein: 1, carbs: 6, fat: 0.3 },
  "havuç": { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  "patates": { kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
  "patlıcan": { kcal: 25, protein: 1, carbs: 6, fat: 0.2 },
  "kabak": { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  "lahana": { kcal: 25, protein: 1.3, carbs: 6, fat: 0.1 },
  "ıspanak": { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  "marul": { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  "salatalık": { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  "turp": { kcal: 16, protein: 0.7, carbs: 3.4, fat: 0.1 },
  "kereviz": { kcal: 14, protein: 0.7, carbs: 3, fat: 0.2 },
  "pırasa": { kcal: 61, protein: 1.5, carbs: 14, fat: 0.3 },
  "balkabağı": { kcal: 26, protein: 1, carbs: 6.5, fat: 0.1 },
  "enginar": { kcal: 47, protein: 3.3, carbs: 11, fat: 0.2 },
  "bamya": { kcal: 33, protein: 1.9, carbs: 7, fat: 0.2 },
  "fasulye": { kcal: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  "bezelye": { kcal: 81, protein: 5.4, carbs: 14, fat: 0.4 },
  "mısır": { kcal: 86, protein: 3.3, carbs: 19, fat: 1.2 },
  "avokado": { kcal: 160, protein: 2, carbs: 9, fat: 15 },
  "mantar": { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },

  // ── Meyveler ──
  "limon": { kcal: 29, protein: 1.1, carbs: 9, fat: 0.3 },
  "portakal": { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  "elma": { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  "muz": { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  "mango": { kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  "çilek": { kcal: 32, protein: 0.7, carbs: 8, fat: 0.3 },
  "kayısı": { kcal: 48, protein: 1.4, carbs: 11, fat: 0.4 },
  "armut": { kcal: 57, protein: 0.4, carbs: 15, fat: 0.1 },
  "incir": { kcal: 74, protein: 0.8, carbs: 19, fat: 0.3 },

  // ── Yağlar ──
  "zeytinyağı": { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  "sıvı yağ": { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  "ayçiçek yağı": { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  "susam yağı": { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  "hindistan cevizi yağı": { kcal: 862, protein: 0, carbs: 0, fat: 100 },

  // ── Kuruyemişler ──
  "ceviz": { kcal: 654, protein: 15, carbs: 14, fat: 65 },
  "badem": { kcal: 579, protein: 21, carbs: 22, fat: 50 },
  "toz badem": { kcal: 579, protein: 21, carbs: 22, fat: 50 },
  "fındık": { kcal: 628, protein: 15, carbs: 17, fat: 61 },
  "antep fıstığı": { kcal: 560, protein: 20, carbs: 28, fat: 45 },
  "yer fıstığı": { kcal: 567, protein: 26, carbs: 16, fat: 49 },
  "hindistan cevizi rendesi": { kcal: 660, protein: 6, carbs: 24, fat: 65 },
  "susam": { kcal: 573, protein: 18, carbs: 23, fat: 50 },
  "tahin": { kcal: 595, protein: 17, carbs: 21, fat: 54 },

  // ── Şekerler ──
  "şeker": { kcal: 387, protein: 0, carbs: 100, fat: 0 },
  "pudra şekeri": { kcal: 389, protein: 0, carbs: 100, fat: 0 },
  "esmer şeker": { kcal: 380, protein: 0, carbs: 98, fat: 0 },
  "bal": { kcal: 304, protein: 0.3, carbs: 82, fat: 0 },
  "pekmez": { kcal: 293, protein: 0.5, carbs: 73, fat: 0 },

  // ── Baharatlar (minimal calorie, 1-2 tsp kullanılır) ──
  "tuz": { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  "karabiber": { kcal: 251, protein: 10, carbs: 64, fat: 3 },
  "pul biber": { kcal: 282, protein: 12, carbs: 50, fat: 6 },
  "kimyon": { kcal: 375, protein: 18, carbs: 44, fat: 22 },
  "kekik": { kcal: 276, protein: 9, carbs: 64, fat: 7 },
  "tarçın": { kcal: 247, protein: 4, carbs: 81, fat: 1 },
  "zerdeçal": { kcal: 312, protein: 10, carbs: 67, fat: 3 },
  "safran": { kcal: 310, protein: 11, carbs: 65, fat: 6 },

  // ── Soslar / Sos malzemeleri ──
  "domates salçası": { kcal: 82, protein: 4, carbs: 18, fat: 0.5 },
  "biber salçası": { kcal: 73, protein: 3, carbs: 15, fat: 0.5 },
  "domates püresi": { kcal: 38, protein: 1.6, carbs: 8, fat: 0.2 },
  "domates sosu": { kcal: 29, protein: 1.3, carbs: 6, fat: 0.1 },
  "soya sosu": { kcal: 53, protein: 8, carbs: 5, fat: 0 },
  "sirke": { kcal: 21, protein: 0, carbs: 0.9, fat: 0 },
  "mayonez": { kcal: 680, protein: 1, carbs: 1, fat: 75 },

  // ── İçecek bazları ──
  "su": { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  "buz": { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  "kahve": { kcal: 2, protein: 0.3, carbs: 0, fat: 0 },
  "çay": { kcal: 1, protein: 0, carbs: 0.3, fat: 0 },
  "hindistan cevizi sütü": { kcal: 230, protein: 2, carbs: 6, fat: 24 },
  "yoğunlaştırılmış süt": { kcal: 321, protein: 8, carbs: 54, fat: 9 },

  // ── Alkol ──
  "votka": { kcal: 231, protein: 0, carbs: 0, fat: 0 },
  "rom": { kcal: 231, protein: 0, carbs: 0, fat: 0 },
  "cin": { kcal: 263, protein: 0, carbs: 0, fat: 0 },
  "tekila": { kcal: 231, protein: 0, carbs: 0, fat: 0 },
  "viski": { kcal: 250, protein: 0, carbs: 0, fat: 0 },
  "şarap": { kcal: 83, protein: 0.1, carbs: 2.6, fat: 0 },
  "bira": { kcal: 43, protein: 0.5, carbs: 3.6, fat: 0 },
  "prosecco": { kcal: 80, protein: 0.1, carbs: 1.5, fat: 0 },
};

// ─── Unit to grams conversion ───────────────────────────────

const UNIT_TO_GRAMS: Record<string, number> = {
  "gr": 1,
  "g": 1,
  "kg": 1000,
  "ml": 1, // approximate: water density
  "lt": 1000,
  "adet": 100, // very rough default for "adet", overridden per ingredient below
  "diş": 5, // garlic clove
  "dal": 30, // herb sprig
  "demet": 50,
  "yaprak": 3,
  "dilim": 30,
  "su bardağı": 200,
  "bardak": 200,
  "çay bardağı": 100,
  "yemek kaşığı": 15,
  "tatlı kaşığı": 10,
  "çay kaşığı": 5,
  "tutam": 1,
};

// Special "adet" overrides for specific ingredients
const ADET_GRAMS: Record<string, number> = {
  "yumurta": 60,
  "soğan": 150,
  "domates": 150,
  "biber": 80,
  "havuç": 80,
  "patates": 150,
  "patlıcan": 200,
  "limon": 80,
  "portakal": 180,
  "elma": 180,
  "muz": 120,
  "mango": 200,
  "mısır koçanı": 200,
  "baget ekmek": 200,
  "pide": 200,
  "tortilla": 40,
};

// ─── Core estimation ────────────────────────────────────────

interface Ingredient {
  name: string;
  amount: string;
  unit: string | null;
}

interface NutritionEstimate {
  averageCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  matchedIngredients: number;
  totalIngredients: number;
}

/**
 * Normalize ingredient name for DB lookup. Strips parenthetical notes,
 * lowercases with Turkish locale, and tries progressively shorter
 * prefixes for fuzzy matching.
 */
function normalizeIngredientName(name: string): string {
  return name
    .replace(/\(.*?\)/g, "") // remove parenthetical notes
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function findNutrient(name: string): NutrientPer100g | null {
  const norm = normalizeIngredientName(name);

  // Exact match
  if (DB[norm]) return DB[norm];

  // Try without trailing words (e.g., "Dana kıyma (yağlı)" → "dana kıyma")
  const words = norm.split(" ");
  for (let len = words.length; len >= 1; len--) {
    const prefix = words.slice(0, len).join(" ");
    if (DB[prefix]) return DB[prefix];
  }

  // Try matching any key that starts with the first word
  const firstWord = words[0];
  if (firstWord && firstWord.length >= 3) {
    for (const [key, val] of Object.entries(DB)) {
      if (key.startsWith(firstWord)) return val;
    }
  }

  return null;
}

function parseAmount(amount: string): number {
  // Handle fractions like "1/2", "1/4"
  if (amount.includes("/")) {
    const parts = amount.split("/");
    const num = parseFloat(parts[0] ?? "0");
    const den = parseFloat(parts[1] ?? "1");
    return den > 0 ? num / den : 0;
  }
  // Handle ranges like "8-10" → take average
  if (amount.includes("-")) {
    const parts = amount.split("-");
    const a = parseFloat(parts[0] ?? "0");
    const b = parseFloat(parts[1] ?? "0");
    return (a + b) / 2;
  }
  // Handle Turkish decimal comma
  const cleaned = amount.replace(",", ".").trim();
  return parseFloat(cleaned) || 0;
}

function getGrams(ingredient: Ingredient): number {
  const amount = parseAmount(ingredient.amount);
  const unit = (ingredient.unit ?? "adet").toLocaleLowerCase("tr-TR").trim();
  const normName = normalizeIngredientName(ingredient.name);

  // Special adet handling
  if (unit === "adet") {
    for (const [key, grams] of Object.entries(ADET_GRAMS)) {
      if (normName.includes(key)) return amount * grams;
    }
    return amount * 100; // default adet
  }

  const gramsPerUnit = UNIT_TO_GRAMS[unit];
  if (gramsPerUnit) return amount * gramsPerUnit;

  // Unknown unit, guess 100g
  return amount * 100;
}

export function estimateNutrition(
  ingredients: Ingredient[],
  servingCount: number,
): NutritionEstimate | null {
  let totalKcal = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let matched = 0;

  for (const ing of ingredients) {
    const nutrient = findNutrient(ing.name);
    if (!nutrient) continue;

    const grams = getGrams(ing);
    const factor = grams / 100;

    totalKcal += nutrient.kcal * factor;
    totalProtein += nutrient.protein * factor;
    totalCarbs += nutrient.carbs * factor;
    totalFat += nutrient.fat * factor;
    matched++;
  }

  // If less than 40% of ingredients matched, estimate is unreliable
  if (matched < ingredients.length * 0.4) return null;

  const servings = Math.max(1, servingCount);
  return {
    averageCalories: Math.round(totalKcal / servings),
    protein: Math.round(totalProtein / servings * 10) / 10,
    carbs: Math.round(totalCarbs / servings * 10) / 10,
    fat: Math.round(totalFat / servings * 10) / 10,
    matchedIngredients: matched,
    totalIngredients: ingredients.length,
  };
}
