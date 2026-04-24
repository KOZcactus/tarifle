/**
 * Pişirdim → pantry decrement hesaplayıcısı.
 *
 * Recipe pişirildiğinde kullanıcının dolabından ilgili malzemeleri düşürür.
 * Miktar dönüşümü (gr↔kg, ml↔lt) `pantry/match.ts`'teki util'ler ile.
 *
 * Prensip:
 *   - Her recipe ingredient için pantry'de aynı isimde kayıt ara (fuzzy).
 *   - Varsa, recipe ingredient amount × (servingsCooked / recipe.servingCount)
 *     kadar düş.
 *   - Unit dönüşüm mümkünse yap (gr↔kg), değilse skip (not found).
 *   - Pantry quantity null ise (miktar belirsiz) dokunma, belirsizde
 *     "hala var" varsayımı daha güvenli.
 *   - Sonuç quantity ≤ 0 olursa 0'a set (item korunur, kullanıcı
 *     manuel silsin veya yeniden doldursun).
 *
 * Optional ingredient'lar da düşülür eğer pantry'de varsa (kullanıcı
 * ingredient listesindeki optional'ı kullandıysa). Optional skip edildi
 * diye pantry'de var olanı atlamak tutarsız olur.
 */
import { ingredientMatches } from "@/lib/ai/matcher";
import {
  parseAmount,
  normalizeUnit,
  convertAmount,
  type PantryStockItem,
} from "./match";

export interface ConsumeRecipeIngredient {
  name: string;
  amount: string;
  unit: string | null;
  isOptional?: boolean;
}

export interface ConsumeStockItem extends PantryStockItem {
  // DB primary key, update için
  id: string;
}

export interface ConsumeDecision {
  pantryItemId: string;
  ingredientName: string; // pantry display name
  before: number | null; // eski quantity
  after: number; // yeni quantity (0 alt bound)
  amountUsed: number; // ne kadar düşüldü (pantry unit cinsinden)
  unit: string | null;
}

export interface ConsumeResult {
  decisions: ConsumeDecision[];
  notFoundRecipeIngredients: string[];
  skippedUnknownQuantity: string[]; // pantry'de var ama miktar null
  skippedIncompatibleUnit: string[]; // birim farklı + dönüşüm yok
}

/**
 * Ana hesaplayıcı. Pure, DB dokunmaz.
 *
 * @param recipeIngredients tarifin ingredient listesi (name + amount + unit)
 * @param recipeServingCount tarifin default porsiyon sayısı (schema)
 * @param servingsCooked kullanıcının pişirdiği porsiyon (genelde recipeServingCount)
 * @param stock kullanıcının güncel pantry stock'u (id + quantity + unit + name)
 */
export function computeConsume(
  recipeIngredients: readonly ConsumeRecipeIngredient[],
  recipeServingCount: number,
  servingsCooked: number,
  stock: readonly ConsumeStockItem[],
): ConsumeResult {
  const scale = servingsCooked / Math.max(recipeServingCount, 1);
  const decisions: ConsumeDecision[] = [];
  const notFoundRecipeIngredients: string[] = [];
  const skippedUnknownQuantity: string[] = [];
  const skippedIncompatibleUnit: string[] = [];

  for (const ing of recipeIngredients) {
    const requiredRaw = parseAmount(ing.amount);
    if (requiredRaw === null) {
      // Amount parse edilemiyorsa (ör. "bir tutam") skip; bu ingredient
      // için pantry tüketimi hesaplanamaz.
      continue;
    }
    const required = requiredRaw * scale;
    const requiredUnit = normalizeUnit(ing.unit);

    const match = stock.find((s) => ingredientMatches(ing.name, s.ingredientName));
    if (!match) {
      if (!ing.isOptional) {
        notFoundRecipeIngredients.push(ing.name);
      }
      continue;
    }

    if (match.quantity === null) {
      skippedUnknownQuantity.push(match.ingredientName);
      continue;
    }

    const stockUnit = normalizeUnit(match.unit);
    // Recipe ingredient'ın miktarını pantry unit'ine dönüştür
    const requiredInStockUnit = convertAmount(required, requiredUnit, stockUnit);
    if (requiredInStockUnit === null) {
      skippedIncompatibleUnit.push(match.ingredientName);
      continue;
    }

    const before = match.quantity;
    const after = Math.max(0, before - requiredInStockUnit);
    decisions.push({
      pantryItemId: match.id,
      ingredientName: match.ingredientName,
      before,
      after,
      amountUsed: before - after,
      unit: match.unit,
    });
  }

  return {
    decisions,
    notFoundRecipeIngredients,
    skippedUnknownQuantity,
    skippedIncompatibleUnit,
  };
}
