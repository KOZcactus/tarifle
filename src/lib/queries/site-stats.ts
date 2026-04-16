import { prisma } from "@/lib/prisma";

/**
 * Public site statistics for /hakkimizda. Lightweight query,
 * cached by Next.js revalidate (1 hour).
 */
export async function getSiteStats(): Promise<{
  recipeCount: number;
  cuisineCount: number;
  categoryCount: number;
  ingredientCount: number;
}> {
  const [recipeCount, cuisines, categoryCount, ingredientCount] =
    await Promise.all([
      prisma.recipe.count({ where: { status: "PUBLISHED" } }),
      prisma.recipe
        .groupBy({
          by: ["cuisine"],
          where: { status: "PUBLISHED", cuisine: { not: null } },
        })
        .then((rows) => rows.length),
      prisma.category.count(),
      prisma.recipeIngredient.findMany({
        select: { name: true },
        distinct: ["name"],
      }).then((rows) => rows.length),
    ]);

  return { recipeCount, cuisineCount: cuisines, categoryCount, ingredientCount };
}
