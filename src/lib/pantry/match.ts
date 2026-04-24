/**
 * UserPantry quantity-aware recipe matcher.
 *
 * Mevcut `src/lib/ai/matcher.ts` binary karşılaştırma yapıyor (pantry'de
 * malzeme var/yok). Bu modül quantity katmanını ekler:
 *   - Pantry'deki miktarı tarif ihtiyacıyla karşılaştırır
 *   - Aynı birim ise sayısal shortage hesaplar
 *   - Farklı birim veya miktar belirtilmemişse "var ama miktar belirsiz"
 *     olarak işaretler
 *
 * Purpose: "2 yumurta var, tarif 5 gerek, 3 eksik" tarzı aydınlatıcı
 * bildirimler için. Tarif sayfasındaki pantry rozeti + AI menü planlayıcı
 * shopping diff detayı burdan beslenir.
 *
 * Birim normalizasyonu sınırlı tutuldu (TR kitchen gerçekçi): gr/kg,
 * ml/lt, adet/tane benzeşimleri. "Yemek kaşığı" / "çay kaşığı" / "su
 * bardağı" cinsinden dönüşüm yapılmaz (imprecise), aynı birim ise
 * karşılaştırılır, değilse miktar belirsiz.
 */
import { ingredientMatches, normalizeIngredient } from "@/lib/ai/matcher";

export interface PantryStockItem {
  ingredientName: string; // normalized TR lowercase
  quantity: number | null;
  unit: string | null;
}

export interface RecipeRequirement {
  name: string; // ham tarif ingredient adı ("Yumurta", "Süt")
  amount: string; // ham string, parse edilecek
  unit: string | null;
  isOptional?: boolean;
}

export interface IngredientMatch {
  recipeIngredient: string; // orijinal recipe ingredient name
  required: number | null; // parse edilmiş miktar, belirsizse null
  requiredUnit: string | null;
  available: number | null; // pantry miktarı (aynı birim cinsinden), yoksa null
  availableUnit: string | null;
  shortage: number | null; // required - available (pozitif = eksik)
  status:
    | "covered" // pantry'de var, miktar yeterli
    | "partial" // pantry'de var, miktar yetersiz (shortage > 0)
    | "present_unknown" // pantry'de var ama miktar karşılaştırılamıyor (farklı birim)
    | "missing"; // pantry'de yok
}

export interface PantryMatchSummary {
  total: number; // toplam required ingredient (optional'lar hariç)
  covered: number; // miktar yeterli
  partial: number; // var ama eksik miktar
  presentUnknown: number; // var ama miktar karşılaştırılamıyor
  missing: number; // hiç yok
  completionRate: number; // (covered + presentUnknown) / total, 0-1
  details: IngredientMatch[];
  shortages: {
    name: string;
    required: number;
    available: number;
    shortage: number;
    unit: string;
  }[]; // sadece partial olanlar
}

/**
 * Parse a recipe amount string into a number.
 * Kabul: "500", "2.5", "1/2", "yarım", "çeyrek", "1 1/2".
 * Dönüş: null parse edilemezse.
 */
export function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLocaleLowerCase("tr");
  if (trimmed.length === 0) return null;

  // Türkçe sayı isimleri
  const wordMap: Record<string, number> = {
    yarım: 0.5,
    "yarim": 0.5,
    çeyrek: 0.25,
    "ceyrek": 0.25,
    birkaç: 2.5,
    "birkac": 2.5,
  };
  if (wordMap[trimmed] !== undefined) return wordMap[trimmed]!;

  // Mixed: "1 1/2"
  const mixedMatch = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(trimmed);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (den > 0) return whole + num / den;
  }

  // Fraction: "1/2"
  const fracMatch = /^(\d+)\s*\/\s*(\d+)$/.exec(trimmed);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (den > 0) return num / den;
  }

  // Simple number
  const simpleMatch = /^(\d+(?:[.,]\d+)?)/.exec(trimmed);
  if (simpleMatch) {
    return Number(simpleMatch[1]!.replace(",", "."));
  }

  return null;
}

/**
 * Normalize a unit string for comparison.
 * TR mutfak birimleri: gr/kilo/kg, ml/litre/lt, adet/tane/tutam.
 */
export function normalizeUnit(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.trim().toLocaleLowerCase("tr");
  if (lower.length === 0) return null;

  // Ağırlık
  if (["gr", "gram", "g"].includes(lower)) return "gr";
  if (["kg", "kilo", "kilogram"].includes(lower)) return "kg";

  // Hacim
  if (["ml", "mililitre"].includes(lower)) return "ml";
  if (["lt", "l", "litre"].includes(lower)) return "lt";

  // Sayı
  if (["adet", "tane"].includes(lower)) return "adet";
  if (["diş"].includes(lower)) return "diş";
  if (["dilim"].includes(lower)) return "dilim";
  if (["tutam"].includes(lower)) return "tutam";
  if (["demet"].includes(lower)) return "demet";

  // Kaşık (fuzzy, birbirine dönüşmez)
  if (["yemek kaşığı", "yemek kasigi"].includes(lower)) return "yemek kasigi";
  if (["çay kaşığı", "cay kasigi"].includes(lower)) return "cay kasigi";
  if (["tatlı kaşığı", "tatli kasigi"].includes(lower)) return "tatli kasigi";
  if (["su bardağı", "su bardagi"].includes(lower)) return "su bardagi";
  if (["çay bardağı", "cay bardagi"].includes(lower)) return "cay bardagi";

  return lower;
}

/**
 * Convert amount between compatible units. Returns null if incompatible.
 * Dönüşüm sadece gr↔kg ve ml↔lt için yapılır.
 */
export function convertAmount(
  amount: number,
  fromUnit: string | null,
  toUnit: string | null,
): number | null {
  const f = normalizeUnit(fromUnit);
  const t = normalizeUnit(toUnit);
  if (f === null || t === null) return null;
  if (f === t) return amount;
  if (f === "gr" && t === "kg") return amount / 1000;
  if (f === "kg" && t === "gr") return amount * 1000;
  if (f === "ml" && t === "lt") return amount / 1000;
  if (f === "lt" && t === "ml") return amount * 1000;
  return null;
}

/**
 * Match a single recipe ingredient against the user's pantry stock.
 */
export function matchIngredient(
  recipeIng: RecipeRequirement,
  stock: readonly PantryStockItem[],
): IngredientMatch {
  const required = parseAmount(recipeIng.amount);
  const requiredUnit = normalizeUnit(recipeIng.unit);

  // Find the matching pantry item via existing fuzzy matcher
  const matchingStock = stock.find((item) => ingredientMatches(recipeIng.name, item.ingredientName));

  if (!matchingStock) {
    return {
      recipeIngredient: recipeIng.name,
      required,
      requiredUnit,
      available: null,
      availableUnit: null,
      shortage: null,
      status: "missing",
    };
  }

  const availableUnit = normalizeUnit(matchingStock.unit);
  const availableRaw = matchingStock.quantity;

  if (availableRaw === null || required === null) {
    return {
      recipeIngredient: recipeIng.name,
      required,
      requiredUnit,
      available: availableRaw,
      availableUnit,
      shortage: null,
      status: "present_unknown",
    };
  }

  // Convert available into required's unit
  const availableInRequiredUnit = convertAmount(availableRaw, availableUnit, requiredUnit);

  if (availableInRequiredUnit === null) {
    // Units incompatible (e.g. gr vs adet), can't compare numerically
    return {
      recipeIngredient: recipeIng.name,
      required,
      requiredUnit,
      available: availableRaw,
      availableUnit,
      shortage: null,
      status: "present_unknown",
    };
  }

  const shortage = Math.max(0, required - availableInRequiredUnit);
  return {
    recipeIngredient: recipeIng.name,
    required,
    requiredUnit,
    available: availableInRequiredUnit,
    availableUnit: requiredUnit,
    shortage,
    status: shortage > 0 ? "partial" : "covered",
  };
}

/**
 * Compute full pantry match summary for a recipe.
 */
export function computePantryMatch(
  recipeIngredients: readonly RecipeRequirement[],
  stock: readonly PantryStockItem[],
): PantryMatchSummary {
  const requiredList = recipeIngredients.filter((ing) => !ing.isOptional);
  const details = requiredList.map((ing) => matchIngredient(ing, stock));

  let covered = 0;
  let partial = 0;
  let presentUnknown = 0;
  let missing = 0;
  const shortages: PantryMatchSummary["shortages"] = [];

  for (const match of details) {
    switch (match.status) {
      case "covered":
        covered++;
        break;
      case "partial":
        partial++;
        if (match.required !== null && match.available !== null && match.shortage !== null) {
          shortages.push({
            name: match.recipeIngredient,
            required: match.required,
            available: match.available,
            shortage: match.shortage,
            unit: match.requiredUnit ?? "",
          });
        }
        break;
      case "present_unknown":
        presentUnknown++;
        break;
      case "missing":
        missing++;
        break;
    }
  }

  const total = requiredList.length;
  // present_unknown'ı "yeterli gibi" say, shortage yok
  const effectivelyCovered = covered + presentUnknown;
  const completionRate = total === 0 ? 0 : effectivelyCovered / total;

  return {
    total,
    covered,
    partial,
    presentUnknown,
    missing,
    completionRate,
    details,
    shortages,
  };
}

/**
 * Short TR summary badge label.
 *   "8/10 malzeme var" veya "Tam dolabına uyuyor" veya "3 malzeme eksik".
 */
export function summaryBadgeLabel(summary: PantryMatchSummary): string {
  if (summary.total === 0) return "Malzeme yok";
  if (summary.missing === 0 && summary.partial === 0) {
    return "Dolabına tam uyuyor";
  }
  if (summary.missing === 0 && summary.partial > 0) {
    return `${summary.total}/${summary.total} var, ${summary.partial} miktar kısmi`;
  }
  const haveCount = summary.covered + summary.presentUnknown + summary.partial;
  return `${haveCount}/${summary.total} dolabında`;
}

/**
 * Helper for pantry items from Prisma → PantryStockItem.
 * Decimal alanlar number'a çevrilir.
 */
export function toPantryStock(items: readonly {
  ingredientName: string;
  quantity: number | { toNumber(): number } | null;
  unit: string | null;
}[]): PantryStockItem[] {
  return items.map((item) => ({
    ingredientName: normalizeIngredient(item.ingredientName),
    quantity:
      item.quantity === null
        ? null
        : typeof item.quantity === "number"
          ? item.quantity
          : item.quantity.toNumber(),
    unit: item.unit,
  }));
}
