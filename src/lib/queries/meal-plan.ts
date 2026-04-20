import type { MealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Haftalık menü planlayıcı query layer.
 *
 * Haftanın başlangıcı, Pazartesi (TR convention). Verilen tarihin haftasının
 * Pazartesi 00:00:00 UTC değerini döner. Timezone minimal: DATE kolonu
 * date-only tutar, saat bileşeni kaybolur.
 */
export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Pazar, 1=Pazartesi, …, 6=Cumartesi
  // Pazar ise 6 gün geri (önceki Pazartesi); aksi halde day-1 gün geri.
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Bu haftanın aktif planı, yoksa null. `findOrCreateThisWeekPlan` server
 *  action katmanında write yapar; bu sadece read. */
export async function getActiveMealPlan(userId: string, reference: Date = new Date()) {
  const monday = getMondayOfWeek(reference);
  return prisma.mealPlan.findUnique({
    where: {
      userId_weekStart: {
        userId,
        weekStart: monday,
      },
    },
    include: {
      items: {
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              slug: true,
              emoji: true,
              totalMinutes: true,
              difficulty: true,
              averageCalories: true,
              cuisine: true,
              category: { select: { name: true, slug: true, emoji: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * UI 7×3 grid render'ı için, plan item'ı (gün, öğün) tuple'ına indeksli
 * döner. Bu bir helper; caller `plan.items` üzerinden de map'leyebilir
 * ama her cell için O(N) scan önlemek için tek geçişte Map'e koyar.
 *
 * Key format: `${dayOfWeek}:${mealType}` → MealPlanItemWithRecipe.
 */
export type MealPlanItemWithRecipe = NonNullable<
  Awaited<ReturnType<typeof getActiveMealPlan>>
>["items"][number];

export function indexMealPlanItems(
  items: readonly MealPlanItemWithRecipe[],
): Map<string, MealPlanItemWithRecipe> {
  const map = new Map<string, MealPlanItemWithRecipe>();
  for (const item of items) {
    map.set(`${item.dayOfWeek}:${item.mealType}`, item);
  }
  return map;
}

/** UI iteration helpers. */
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
export const MEAL_TYPES: readonly MealType[] = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
] as const;
