"use server";

import { MealType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMenuPlanner,
  regenerateSingleSlot,
} from "@/lib/ai/menu-planner";
import type { AiSuggestion, WeeklyMenuResponse } from "@/lib/ai/types";
import {
  applyWeeklyMenuSchema,
  regenerateMenuSlotSchema,
  weeklyMenuSchema,
  type ApplyWeeklyMenuInput,
} from "@/lib/validators";
import {
  checkRateLimit,
  getClientIp,
  rateLimitIdentifier,
} from "@/lib/rate-limit";
import { getActiveMealPlan, getMondayOfWeek } from "@/lib/queries/meal-plan";
import { addItemsFromRecipe } from "@/lib/queries/shopping-list";
import { getUserPantryStock } from "@/lib/pantry/server";
import { revalidatePath } from "next/cache";

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Generates a 7×3 weekly menu from pantry + filters. Read-only, does not
 * touch the user's meal plan. UI renders the preview; user clicks "Apply"
 * to call applyWeeklyMenuAction.
 */
export async function generateWeeklyMenuAction(
  raw: unknown,
): Promise<ActionResult<WeeklyMenuResponse>> {
  const session = await auth();
  const ip = session?.user?.id ? null : await getClientIp();
  const rate = await checkRateLimit(
    "ai-menu-planner",
    rateLimitIdentifier(session?.user?.id, ip),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = weeklyMenuSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }

  try {
    // v4.3+ miktar farkindaligi: giris yapmis kullanici icin UserPantry
    // stock'unu fetch et + planner'a inject. Boylece her aday icin
    // quantity-aware pantryMatch hesaplanir (UI shopping diff detayi) +
    // requireFullyStocked filter'i calisir.
    const pantryStock = session?.user?.id
      ? await getUserPantryStock(session.user.id).catch(() => [])
      : [];

    const planner = getMenuPlanner();
    const result = await planner.plan({
      ...parsed.data,
      pantryStock,
    });
    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Menü oluşturulamadı.";
    return { success: false, error: message };
  }
}

/**
 * Writes the selected slots to the user's active MealPlan. Creates the
 * plan for the current week (Monday anchor) if one does not exist yet.
 * Login required. If `replace` is true existing items are overwritten,
 * otherwise only empty slots are filled.
 */
export async function applyWeeklyMenuAction(
  raw: unknown,
): Promise<ActionResult<{ applied: number; skipped: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Oturum açman gerekiyor." };
  }

  const rate = await checkRateLimit(
    "ai-menu-apply",
    rateLimitIdentifier(session.user.id, null),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = applyWeeklyMenuSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }

  const { slots, replace = false }: ApplyWeeklyMenuInput = parsed.data;

  try {
    // Confirm all recipeIds exist + are PUBLISHED. A user could craft
    // arbitrary IDs in the client payload; validate server-side.
    const uniqueIds = Array.from(new Set(slots.map((s) => s.recipeId)));
    const found = await prisma.recipe.findMany({
      where: { id: { in: uniqueIds }, status: "PUBLISHED" },
      select: { id: true },
    });
    const validIds = new Set(found.map((r) => r.id));
    const filtered = slots.filter((s) => validIds.has(s.recipeId));
    if (filtered.length === 0) {
      return { success: false, error: "Geçerli tarif bulunamadı." };
    }

    const userId = session.user.id;
    const anchor = getMondayOfWeek();

    // Ensure the active meal plan exists; create if missing.
    let plan = await getActiveMealPlan(userId);
    if (!plan) {
      plan = await prisma.mealPlan.create({
        data: { userId, weekStart: anchor },
        include: {
          items: {
            include: {
              recipe: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  emoji: true,
                  imageUrl: true,
                  totalMinutes: true,
                  servingCount: true,
                },
              },
            },
          },
        },
      });
    }

    const existing = new Map<string, string>();
    for (const item of plan.items) {
      existing.set(`${item.dayOfWeek}-${item.mealType}`, item.id);
    }

    let applied = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const slot of filtered) {
        const key = `${slot.dayOfWeek}-${slot.mealType}`;
        const existingId = existing.get(key);
        if (existingId && !replace) {
          skipped++;
          continue;
        }
        if (existingId) {
          await tx.mealPlanItem.update({
            where: { id: existingId },
            data: { recipeId: slot.recipeId },
          });
        } else {
          await tx.mealPlanItem.create({
            data: {
              mealPlanId: plan.id,
              dayOfWeek: slot.dayOfWeek,
              mealType: slot.mealType as MealType,
              recipeId: slot.recipeId,
            },
          });
        }
        applied++;
      }
    });

    revalidatePath("/menu-planlayici");
    return { success: true, data: { applied, skipped } };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Menü kaydedilemedi.";
    return { success: false, error: message };
  }
}

/**
 * v4.3 Tek-slot regenerate. Mevcut 20 dolu slot'u değiştirmeden
 * `targetDay` + `targetMeal` hücresine yeni bir tarif çeker. Çakışma,
 * kategori cap (2/hafta), mutfak cap (3/hafta) kuralları client'tan
 * gönderilen `currentSlots`'tan rebuild edilir, böylece haftalık
 * çeşitlilik disiplinini korur.
 */
export async function regenerateMenuSlotAction(
  raw: unknown,
): Promise<ActionResult<{ recipe: AiSuggestion | null; reason?: string }>> {
  const session = await auth();
  const ip = session?.user?.id ? null : await getClientIp();
  const rate = await checkRateLimit(
    "ai-menu-planner",
    rateLimitIdentifier(session?.user?.id, ip),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = regenerateMenuSlotSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }
  const { input, targetDay, targetMeal, currentSlots } = parsed.data;

  // Hedef hücre dışındaki slotlardan exclude + cap sayaçları rebuild.
  const excludeSlugs = new Set<string>();
  const categoryCount = new Map<string, number>();
  const cuisineCount = new Map<string, number>();
  for (const s of currentSlots) {
    if (s.dayOfWeek === targetDay && s.mealType === targetMeal) continue;
    excludeSlugs.add(s.slug);
    categoryCount.set(s.categoryName, (categoryCount.get(s.categoryName) ?? 0) + 1);
    if (s.cuisine)
      cuisineCount.set(s.cuisine, (cuisineCount.get(s.cuisine) ?? 0) + 1);
  }

  try {
    const result = await regenerateSingleSlot(input, {
      targetMeal,
      excludeSlugs,
      categoryCount,
      cuisineCount,
    });
    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Slot yenilenemedi.";
    return { success: false, error: message };
  }
}

const addRecipesToShoppingListSchema = z.object({
  recipeIds: z
    .array(z.string().min(1))
    .min(1, "En az bir tarif gerekli.")
    .max(21, "En fazla 21 tarif işlenir."),
  personCount: z.number().int().min(1).max(12).optional(),
});

/**
 * AI v4 preview'den doğrudan alışveriş listesine ekle. Plan henüz
 * MealPlan olarak kaydedilmese bile kullanıcı "menüdeki eksik
 * malzemeleri listeye al" diyebilir. Tekrarlanan recipeId'ler dedup'lanır
 * (aynı tarif iki farklı slotta → tek ingredient seti).
 */
export async function addRecipesToShoppingListAction(
  raw: unknown,
): Promise<ActionResult<{ recipeCount: number; totalAdded: number; totalMerged: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Oturum açman gerekiyor." };
  }
  const rate = await checkRateLimit(
    "ai-menu-apply",
    rateLimitIdentifier(session.user.id, null),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = addRecipesToShoppingListSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }

  const uniqueIds = [...new Set(parsed.data.recipeIds)];
  const personCount = parsed.data.personCount ?? 1;

  try {
    // Validate recipeIds exist + PUBLISHED (v4 preview güvenilmez, client
    // payload'ı manipüle edilebilir).
    const found = await prisma.recipe.findMany({
      where: { id: { in: uniqueIds }, status: "PUBLISHED" },
      select: { id: true, servingCount: true },
    });
    if (found.length === 0) {
      return { success: false, error: "Geçerli tarif bulunamadı." };
    }

    let totalAdded = 0;
    let totalMerged = 0;
    for (const recipe of found) {
      const servingScale =
        recipe.servingCount > 0 && personCount !== recipe.servingCount
          ? personCount / recipe.servingCount
          : 1;
      const res = await addItemsFromRecipe(session.user.id, recipe.id, {
        servingScale,
      });
      totalAdded += res.added;
      totalMerged += res.merged;
    }
    revalidatePath("/alisveris-listesi");
    return {
      success: true,
      data: {
        recipeCount: found.length,
        totalAdded,
        totalMerged,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Listeye eklenemedi.",
    };
  }
}
