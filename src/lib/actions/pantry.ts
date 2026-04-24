"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";
import {
  computeConsume,
  type ConsumeResult,
  type ConsumeStockItem,
} from "@/lib/pantry/consume";

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

const ingredientNameSchema = z.string().trim().min(1).max(80);

function normalizeIngredientName(raw: string): string {
  return raw.trim().toLocaleLowerCase("tr");
}

const addSchema = z.object({
  name: ingredientNameSchema,
  quantity: z.number().positive().max(9999).optional(),
  unit: z.string().max(30).optional(),
  expiryDate: z.string().optional(), // ISO date YYYY-MM-DD
  note: z.string().max(200).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().positive().max(9999).nullable().optional(),
  unit: z.string().max(30).nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  note: z.string().max(200).nullable().optional(),
});

const bulkAddSchema = z.object({
  names: z.array(ingredientNameSchema).min(1).max(50),
});

export interface UserPantryItemView {
  id: string;
  ingredientName: string;
  displayName: string;
  quantity: number | null;
  unit: string | null;
  expiryDate: string | null; // ISO date
  note: string | null;
  addedAt: string;
  daysToExpiry: number | null; // hesaplanmış convenience
}

function toView(row: {
  id: string;
  ingredientName: string;
  displayName: string | null;
  quantity: unknown;
  unit: string | null;
  expiryDate: Date | null;
  note: string | null;
  addedAt: Date;
}): UserPantryItemView {
  const now = new Date();
  let daysToExpiry: number | null = null;
  if (row.expiryDate) {
    const diffMs = row.expiryDate.getTime() - now.setHours(0, 0, 0, 0);
    daysToExpiry = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
  // displayName null ise ingredientName'i title-case ile göster
  const display =
    row.displayName ??
    row.ingredientName.replace(/(^|\s)\S/g, (c) => c.toLocaleUpperCase("tr"));
  const quantityNum =
    row.quantity == null
      ? null
      : typeof row.quantity === "number"
        ? row.quantity
        : Number(row.quantity);
  return {
    id: row.id,
    ingredientName: row.ingredientName,
    displayName: display,
    quantity: quantityNum,
    unit: row.unit,
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : null,
    note: row.note,
    addedAt: row.addedAt.toISOString(),
    daysToExpiry,
  };
}

/** Kullanıcının tüm pantry'sini döndürür. Son kullanma yakın olanlar üstte. */
export async function getUserPantryAction(): Promise<
  ActionResult<UserPantryItemView[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  try {
    const rows = await prisma.userPantryItem.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { expiryDate: { sort: "asc", nulls: "last" } },
        { addedAt: "desc" },
      ],
    });
    return { success: true, data: rows.map(toView) };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Dolap okunamadı.",
    };
  }
}

/**
 * Pantry'ye tek malzeme ekler (yoksa) veya günceller (varsa).
 * Upsert pattern: userId + normalize(name) unique key.
 */
export async function addPantryItemAction(
  raw: unknown,
): Promise<ActionResult<UserPantryItemView>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const rate = await checkRateLimit(
    "pantry-mutation",
    rateLimitIdentifier(session.user.id, null),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = addSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }
  const { name, quantity, unit, expiryDate, note } = parsed.data;
  const normalized = normalizeIngredientName(name);

  try {
    const row = await prisma.userPantryItem.upsert({
      where: {
        userId_ingredientName: {
          userId: session.user.id,
          ingredientName: normalized,
        },
      },
      create: {
        userId: session.user.id,
        ingredientName: normalized,
        displayName: name.trim(),
        quantity: quantity ?? null,
        unit: unit ?? null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        note: note ?? null,
      },
      update: {
        displayName: name.trim(),
        ...(quantity !== undefined ? { quantity } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(expiryDate !== undefined
          ? { expiryDate: expiryDate ? new Date(expiryDate) : null }
          : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });
    revalidatePath("/dolap");
    return { success: true, data: toView(row) };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Dolaba eklenemedi.",
    };
  }
}

/** Toplu ekle (sadece isim, quantity/expiry sonra düzenlenir). */
export async function bulkAddPantryItemsAction(
  raw: unknown,
): Promise<ActionResult<{ added: number; updated: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const rate = await checkRateLimit(
    "pantry-mutation",
    rateLimitIdentifier(session.user.id, null),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = bulkAddSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }
  try {
    let added = 0;
    let updated = 0;
    for (const name of parsed.data.names) {
      const normalized = normalizeIngredientName(name);
      const res = await prisma.userPantryItem.upsert({
        where: {
          userId_ingredientName: {
            userId: session.user.id,
            ingredientName: normalized,
          },
        },
        create: {
          userId: session.user.id,
          ingredientName: normalized,
          displayName: name.trim(),
        },
        update: { displayName: name.trim() },
      });
      // Rough detection: addedAt çok yeni ise added, değilse updated.
      if (Date.now() - res.addedAt.getTime() < 5_000) added++;
      else updated++;
    }
    revalidatePath("/dolap");
    return { success: true, data: { added, updated } };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Toplu ekleme hata.",
    };
  }
}

/** Malzeme günceller (miktar/birim/tarih/not). */
export async function updatePantryItemAction(
  raw: unknown,
): Promise<ActionResult<UserPantryItemView>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }
  const { id, quantity, unit, expiryDate, note } = parsed.data;

  try {
    const existing = await prisma.userPantryItem.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== session.user.id) {
      return { success: false, error: "not-found" };
    }
    const row = await prisma.userPantryItem.update({
      where: { id },
      data: {
        ...(quantity !== undefined ? { quantity } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(expiryDate !== undefined
          ? { expiryDate: expiryDate ? new Date(expiryDate) : null }
          : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });
    revalidatePath("/dolap");
    return { success: true, data: toView(row) };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Güncelleme hata.",
    };
  }
}

/** Malzeme siler. */
export async function removePantryItemAction(
  id: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  try {
    const existing = await prisma.userPantryItem.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== session.user.id) {
      return { success: false, error: "not-found" };
    }
    await prisma.userPantryItem.delete({ where: { id } });
    revalidatePath("/dolap");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Silme hata.",
    };
  }
}

const consumeSchema = z.object({
  recipeId: z.string().min(1),
  servingsCooked: z.number().positive().max(50).optional(),
});

/**
 * Pişirdim → UserPantry'dan tarif ingredient miktarlarını düşür.
 *
 * - Rate limit: "pantry-mutation" key ile aynı bucket (60/dk).
 * - Recipe ingredient eşleşen pantry item'ların quantity'si düşülür.
 * - Aynı anda birden fazla item update = $transaction.
 * - Sonuç: ConsumeResult UI'ye döner (düşülen/bulunamayan/atlanan).
 */
export async function consumeRecipeFromPantryAction(
  raw: unknown,
): Promise<ActionResult<ConsumeResult>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const parsed = consumeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "invalid input",
    };
  }

  const rate = await checkRateLimit(
    "pantry-mutation",
    rateLimitIdentifier(session.user.id, null),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parsed.data.recipeId },
      select: {
        id: true,
        servingCount: true,
        ingredients: {
          select: { name: true, amount: true, unit: true, isOptional: true },
        },
      },
    });
    if (!recipe) return { success: false, error: "recipe-not-found" };

    const stockRows = await prisma.userPantryItem.findMany({
      where: { userId: session.user.id },
      select: { id: true, ingredientName: true, quantity: true, unit: true },
    });
    const stock: ConsumeStockItem[] = stockRows.map((row) => ({
      id: row.id,
      ingredientName: row.ingredientName,
      quantity: row.quantity === null ? null : Number(row.quantity),
      unit: row.unit,
    }));

    const result = computeConsume(
      recipe.ingredients,
      recipe.servingCount,
      parsed.data.servingsCooked ?? recipe.servingCount,
      stock,
    );

    if (result.decisions.length > 0) {
      await prisma.$transaction(
        result.decisions.map((d) =>
          prisma.userPantryItem.update({
            where: { id: d.pantryItemId },
            data: { quantity: d.after },
          }),
        ),
      );
      revalidatePath("/dolap");
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tüketme hata.",
    };
  }
}
