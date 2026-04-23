"use server";

import { MealType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMenuPlanner } from "@/lib/ai/menu-planner";
import type { WeeklyMenuResponse } from "@/lib/ai/types";
import {
  applyWeeklyMenuSchema,
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
    const planner = getMenuPlanner();
    const result = await planner.plan(parsed.data);
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

const addRecipesToShoppingListSchema = z.object({
  recipeIds: z
    .array(z.string().min(1))
    .min(1, "En az bir tarif gerekli.")
    .max(21, "En fazla 21 tarif işlenir."),
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

  try {
    // Validate recipeIds exist + PUBLISHED (v4 preview güvenilmez, client
    // payload'ı manipüle edilebilir).
    const found = await prisma.recipe.findMany({
      where: { id: { in: uniqueIds }, status: "PUBLISHED" },
      select: { id: true },
    });
    const validIds = found.map((r) => r.id);
    if (validIds.length === 0) {
      return { success: false, error: "Geçerli tarif bulunamadı." };
    }

    let totalAdded = 0;
    let totalMerged = 0;
    for (const recipeId of validIds) {
      const res = await addItemsFromRecipe(session.user.id, recipeId);
      totalAdded += res.added;
      totalMerged += res.merged;
    }
    revalidatePath("/alisveris-listesi");
    return {
      success: true,
      data: {
        recipeCount: validIds.length,
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
