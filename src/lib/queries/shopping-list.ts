import { prisma } from "@/lib/prisma";

/**
 * Returns the user's shopping list (creates default one if missing).
 */
export async function getOrCreateShoppingList(userId: string) {
  const existing = await prisma.shoppingList.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return prisma.shoppingList.create({
    data: { userId },
  });
}

export async function getShoppingListWithItems(userId: string) {
  const list = await getOrCreateShoppingList(userId);
  return prisma.shoppingList.findUnique({
    where: { id: list.id },
    include: {
      items: {
        orderBy: [{ isChecked: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

/**
 * Scales an amount string by a factor. Handles numeric strings, simple
 * fractions ("1/2"), ranges ("1-2"), and pass-through for non-numeric
 * amounts ("tat için", "yeterince"). Rounds to 2 decimals, trims
 * trailing ".00". Keeps ".5" suffix when factor produces half units.
 */
export function scaleAmount(amount: string, factor: number): string {
  if (!amount || factor === 1) return amount;
  const trimmed = amount.trim();
  // Range "1-2"
  const rangeMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/);
  if (rangeMatch) {
    const lo = Number(rangeMatch[1]!.replace(",", ".")) * factor;
    const hi = Number(rangeMatch[2]!.replace(",", ".")) * factor;
    return `${formatNumber(lo)}-${formatNumber(hi)}`;
  }
  // Fraction "1/2"
  const fracMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const val = (Number(fracMatch[1]!) / Number(fracMatch[2]!)) * factor;
    return formatNumber(val);
  }
  // Plain number ("2", "2.5", "2,5")
  const numMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)$/);
  if (numMatch) {
    const val = Number(numMatch[1]!.replace(",", ".")) * factor;
    return formatNumber(val);
  }
  // Non-numeric ("tat için", "1 tutam"): pass through
  return amount;
}

function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

export async function addItemsFromRecipe(
  userId: string,
  recipeId: string,
  options: { servingScale?: number } = {},
): Promise<{ added: number; merged: number }> {
  const list = await getOrCreateShoppingList(userId);

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: { orderBy: { sortOrder: "asc" } } },
  });

  if (!recipe) {
    throw new Error("Tarif bulunamadı.");
  }

  const scale = options.servingScale && options.servingScale > 0
    ? options.servingScale
    : 1;

  // Existing items in the list (used for deduplication)
  const existing = await prisma.shoppingListItem.findMany({
    where: { shoppingListId: list.id },
  });

  const normalize = (s: string) => s.trim().toLocaleLowerCase("tr");
  const existingNames = new Set(existing.map((i) => normalize(i.name)));

  const newItems = recipe.ingredients
    .filter((ing) => !existingNames.has(normalize(ing.name)))
    .map((ing, index) => ({
      shoppingListId: list.id,
      name: ing.name,
      amount: scale === 1 ? ing.amount : scaleAmount(ing.amount, scale),
      unit: ing.unit,
      sourceRecipeId: recipeId,
      sortOrder: existing.length + index,
    }));

  if (newItems.length > 0) {
    await prisma.shoppingListItem.createMany({ data: newItems });
  }

  return {
    added: newItems.length,
    merged: recipe.ingredients.length - newItems.length,
  };
}

export async function addCustomItem(
  userId: string,
  data: { name: string; amount?: string; unit?: string },
) {
  const list = await getOrCreateShoppingList(userId);
  const count = await prisma.shoppingListItem.count({
    where: { shoppingListId: list.id },
  });

  return prisma.shoppingListItem.create({
    data: {
      shoppingListId: list.id,
      name: data.name,
      amount: data.amount,
      unit: data.unit,
      sortOrder: count,
    },
  });
}

export async function toggleItemChecked(
  userId: string,
  itemId: string,
): Promise<boolean> {
  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    include: { shoppingList: true },
  });

  if (!item || item.shoppingList.userId !== userId) {
    throw new Error("Öge bulunamadı.");
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { isChecked: !item.isChecked },
  });

  return updated.isChecked;
}

export async function removeItem(userId: string, itemId: string) {
  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    include: { shoppingList: true },
  });

  if (!item || item.shoppingList.userId !== userId) {
    throw new Error("Öge bulunamadı.");
  }

  await prisma.shoppingListItem.delete({ where: { id: itemId } });
}

export async function clearCheckedItems(userId: string) {
  const list = await getOrCreateShoppingList(userId);
  return prisma.shoppingListItem.deleteMany({
    where: { shoppingListId: list.id, isChecked: true },
  });
}

export async function clearAllItems(userId: string) {
  const list = await getOrCreateShoppingList(userId);
  return prisma.shoppingListItem.deleteMany({
    where: { shoppingListId: list.id },
  });
}
