/**
 * Server-side pantry helpers.
 *
 * Pantry stock fetch + quantity match hesaplaması. `src/lib/pantry/match.ts`
 * pure util; bu dosya DB erişimi ile sarmalar.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import {
  computePantryMatch,
  toPantryStock,
  type PantryStockItem,
  type PantryMatchSummary,
  type RecipeRequirement,
} from "./match";

/**
 * Fetch the current pantry stock for a user, normalized for match input.
 */
export async function getUserPantryStock(userId: string): Promise<PantryStockItem[]> {
  const items = await prisma.userPantryItem.findMany({
    where: { userId },
    select: { ingredientName: true, quantity: true, unit: true },
  });
  return toPantryStock(
    items.map((i) => ({
      ingredientName: i.ingredientName,
      quantity: i.quantity === null ? null : i.quantity,
      unit: i.unit,
    })),
  );
}

/**
 * Compute pantry match against a given recipe's ingredient list.
 */
export async function getPantryMatchForRecipe(
  userId: string,
  recipeIngredients: readonly RecipeRequirement[],
): Promise<PantryMatchSummary> {
  const stock = await getUserPantryStock(userId);
  return computePantryMatch(recipeIngredients, stock);
}
