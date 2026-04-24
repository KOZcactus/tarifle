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

/**
 * Checked (isaretli) shopping list item'larini UserPantry'ye upsert edip
 * shopping list'ten siler. Kullanici "satin aldim, dolaba gectim" senaryosu.
 *
 * Davranis:
 *   - Her checked item -> UserPantry upsert (composite key userId + normalized
 *     name). Ayni isim varsa quantity update, yoksa insert.
 *   - Quantity parse edilebiliyorsa sayisal UserPantry.quantity olur; aksi
 *     halde null (var ama miktar belirsiz).
 *   - Shopping list item'lari silinir.
 *   - Tum islem tek transaction.
 *
 * @returns `{ movedCount, conflicts }` - kac item tasindi + kac tanesi ayni
 *   isimdeki mevcut pantry ile conflict verdi (upsert ile increment yapildi).
 */
export async function moveCheckedToPantry(
  userId: string,
  parseAmount: (raw: string | null | undefined) => number | null,
): Promise<{ movedCount: number; incrementedExisting: number }> {
  const list = await getOrCreateShoppingList(userId);
  const checked = await prisma.shoppingListItem.findMany({
    where: { shoppingListId: list.id, isChecked: true },
    select: { id: true, name: true, amount: true, unit: true },
  });
  if (checked.length === 0) return { movedCount: 0, incrementedExisting: 0 };

  // Gerekli onceden parse et (transaction disinda sade, Prisma Decimal
  // serialize edilsin diye string -> number burada yapilir).
  const records = checked.map((item) => {
    const normalizedName = item.name.trim().toLocaleLowerCase("tr");
    const qty = parseAmount(item.amount);
    return {
      originalName: item.name,
      normalizedName,
      displayName: item.name,
      quantity: qty,
      unit: item.unit,
      itemId: item.id,
    };
  });

  // Var olan ayni isimli pantry entry'leri say (incrementedExisting metric).
  const existingMap = new Map<string, { id: string; quantity: number | null; unit: string | null }>();
  const existingRows = await prisma.userPantryItem.findMany({
    where: {
      userId,
      ingredientName: { in: records.map((r) => r.normalizedName) },
    },
    select: { id: true, ingredientName: true, quantity: true, unit: true },
  });
  for (const row of existingRows) {
    existingMap.set(row.ingredientName, {
      id: row.id,
      quantity: row.quantity === null ? null : Number(row.quantity),
      unit: row.unit,
    });
  }

  const txSteps = records.flatMap((r) => {
    const existing = existingMap.get(r.normalizedName);
    // Upsert: yoksa create, varsa quantity ekle (ayni unit ise).
    let newQuantity: number | null = r.quantity;
    if (existing) {
      if (existing.quantity !== null && r.quantity !== null && existing.unit === r.unit) {
        newQuantity = existing.quantity + r.quantity;
      } else if (existing.quantity !== null && r.quantity === null) {
        newQuantity = existing.quantity; // yeni miktar yok, eskiyi koru
      } else {
        newQuantity = r.quantity ?? existing.quantity;
      }
    }
    return [
      prisma.userPantryItem.upsert({
        where: {
          userId_ingredientName: {
            userId,
            ingredientName: r.normalizedName,
          },
        },
        create: {
          userId,
          ingredientName: r.normalizedName,
          displayName: r.displayName,
          quantity: newQuantity,
          unit: r.unit,
        },
        update: {
          quantity: newQuantity,
          unit: r.unit ?? existing?.unit ?? null,
          displayName: r.displayName,
        },
      }),
      prisma.shoppingListItem.delete({ where: { id: r.itemId } }),
    ];
  });

  await prisma.$transaction(txSteps);

  return {
    movedCount: records.length,
    incrementedExisting: existingRows.length,
  };
}
