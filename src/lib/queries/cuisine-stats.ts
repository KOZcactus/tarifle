import { prisma } from "@/lib/prisma";
import { CUISINE_LABEL, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";

export interface CuisineStat {
  code: string;
  label: string;
  flag: string;
  count: number;
}

/**
 * Get cuisine distribution — count of published recipes per cuisine code.
 * Returns only cuisines with ≥3 recipes, sorted by count desc.
 */
export async function getCuisineStats(): Promise<CuisineStat[]> {
  const rows = await prisma.recipe.groupBy({
    by: ["cuisine"],
    where: { status: "PUBLISHED", cuisine: { not: null } },
    _count: true,
    orderBy: { _count: { cuisine: "desc" } },
  });

  return rows
    .filter((r) => r.cuisine && r._count >= 3)
    .map((r) => ({
      code: r.cuisine!,
      label: CUISINE_LABEL[r.cuisine as CuisineCode] ?? r.cuisine!,
      flag: CUISINE_FLAG[r.cuisine as CuisineCode] ?? "🌍",
      count: r._count,
    }));
}
