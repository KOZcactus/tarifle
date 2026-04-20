"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { MealType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addItemsFromRecipe } from "@/lib/queries/shopping-list";
import { getMondayOfWeek } from "@/lib/queries/meal-plan";

async function requireSession(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Giriş yapmalısınız.");
  }
  return session.user.id;
}

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

const slotSchema = z.object({
  recipeId: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  servings: z.number().int().min(1).max(20).optional(),
});

/**
 * Bu haftanın planını oluştur ya da döndür. Idempotent, aynı user +
 * weekStart için tek row (@@unique). Sayfa ilk yüklemede implicit
 * çağrılır.
 */
export async function ensureThisWeekPlanAction(): Promise<
  ActionResult<{ planId: string }>
> {
  try {
    const userId = await requireSession();
    const weekStart = getMondayOfWeek();
    const plan = await prisma.mealPlan.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: { userId, weekStart },
      update: {},
      select: { id: true },
    });
    return { success: true, data: { planId: plan.id } };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Beklenmeyen hata.",
    };
  }
}

/**
 * Slot'a tarif ata (veya mevcut slot'un tarifini değiştir). Upsert
 * pattern, yeni satır veya existing row'un recipeId'sini update.
 */
export async function setMealPlanSlotAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    const parsed = slotSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Geçersiz slot.",
      };
    }
    const { recipeId, dayOfWeek, mealType, servings } = parsed.data;

    // Tarif gerçekten var mı + user'ın bu haftaki planı var mı? Tek
    // query'de upsert yapıyoruz; önce ensure plan varlığı.
    const weekStart = getMondayOfWeek();
    const plan = await prisma.mealPlan.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: { userId, weekStart },
      update: {},
      select: { id: true },
    });

    // Recipe existence check, fail explicit, UI'da "tarif bulunamadı"
    // hatası aşikar olsun.
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, status: true },
    });
    if (!recipe || recipe.status !== "PUBLISHED") {
      return { success: false, error: "Tarif bulunamadı." };
    }

    await prisma.mealPlanItem.upsert({
      where: {
        mealPlanId_dayOfWeek_mealType: {
          mealPlanId: plan.id,
          dayOfWeek,
          mealType,
        },
      },
      create: {
        mealPlanId: plan.id,
        recipeId,
        dayOfWeek,
        mealType,
        servings: servings ?? 1,
      },
      update: {
        recipeId,
        servings: servings ?? 1,
      },
    });

    revalidatePath("/menu-planlayici");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Beklenmeyen hata.",
    };
  }
}

/** Slot'u boşalt, item satırını sil. No-op eğer zaten boşsa. */
export async function clearMealPlanSlotAction(input: {
  dayOfWeek: number;
  mealType: MealType;
}): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    const weekStart = getMondayOfWeek();
    const plan = await prisma.mealPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      select: { id: true },
    });
    if (!plan) return { success: true }; // Plan yok zaten.

    await prisma.mealPlanItem.deleteMany({
      where: {
        mealPlanId: plan.id,
        dayOfWeek: input.dayOfWeek,
        mealType: input.mealType,
      },
    });

    revalidatePath("/menu-planlayici");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Beklenmeyen hata.",
    };
  }
}

/**
 * Plan'daki tüm tariflerin ingredient'lerini mevcut shopping list'e
 * ekle. Tarif başına `addItemsFromRecipe` çağrısı, mevcut merge
 * mantığı (aynı isim + unit varsa amount birleşir) kullanılır.
 * Tekrarlanan tarif (aynı tarif birden fazla slot'ta) için aynı
 * ingredient seti birden fazla kez eklenmez, shopping list zaten
 * merge eder ama yine de tarif ID bazlı dedup yaparız.
 */
export async function addMealPlanToShoppingListAction(): Promise<
  ActionResult<{ recipeCount: number; totalAdded: number; totalMerged: number }>
> {
  try {
    const userId = await requireSession();
    const weekStart = getMondayOfWeek();
    const plan = await prisma.mealPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      select: {
        items: { select: { recipeId: true } },
      },
    });
    if (!plan || plan.items.length === 0) {
      return {
        success: false,
        error: "Planda henüz tarif yok.",
      };
    }

    const uniqueRecipeIds = [
      ...new Set(plan.items.map((i) => i.recipeId)),
    ];

    let totalAdded = 0;
    let totalMerged = 0;
    for (const recipeId of uniqueRecipeIds) {
      const res = await addItemsFromRecipe(userId, recipeId);
      totalAdded += res.added;
      totalMerged += res.merged;
    }

    revalidatePath("/alisveris-listesi");
    revalidatePath("/menu-planlayici");
    return {
      success: true,
      data: {
        recipeCount: uniqueRecipeIds.length,
        totalAdded,
        totalMerged,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Beklenmeyen hata.",
    };
  }
}
