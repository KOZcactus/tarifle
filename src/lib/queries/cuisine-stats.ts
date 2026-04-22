import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CUISINE_LABEL, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";

export interface CuisineStat {
  code: string;
  label: string;
  flag: string;
  count: number;
}

/**
 * Get cuisine distribution, count of published recipes per cuisine code.
 * Returns only cuisines with ≥3 recipes, sorted by count desc.
 *
 * Cached for 5 minutes (homepage + /kesfet hot path, yeni seed veya
 * cuisine değişiklikleri ≤5 dk içinde yansır, saniyede DB round-trip
 * yerine memory hit). Revalidate: sadece yeni batch seed sonrası manuel
 * `revalidateTag("cuisine-stats")` çağrısıyla force (şu an otomatik
 * trigger yok, TTL yeterli).
 */
export const getCuisineStats = unstable_cache(
  async (): Promise<CuisineStat[]> => {
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
  },
  ["cuisine-stats-v1"],
  // Oturum 12 tune: 30 dk -> 2 sa. 24 cuisine sabit, batch ekleme
  // sonrası _count azar azar artar ama absolute değerler minor fark
  // (Türk ~%54). 2 saatlik stale tamamen kabul edilebilir.
  { revalidate: 7200, tags: ["cuisine-stats"] },
);
