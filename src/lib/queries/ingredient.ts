import { prisma } from "@/lib/prisma";

/**
 * Returns a deduplicated, sorted list of ingredient names from all
 * published recipes. Used by the AI Asistan autocomplete.
 *
 * Normalization: strips parenthetical notes like "(yağlı)", "(olgun)",
 * lowercases with Turkish locale, deduplicates. Returns the "prettiest"
 * version of each name (first seen casing).
 *
 * Cached by Next.js Data Cache — re-fetched only on new deployments
 * or explicit revalidation. ~700 unique names at 806 recipes.
 */
export async function getUniqueIngredientNames(): Promise<string[]> {
  const rows = await prisma.recipeIngredient.findMany({
    where: { recipe: { status: "PUBLISHED" } },
    select: { name: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
  });

  // Normalize + deduplicate (e.g., "Domates" vs "domates" vs "Domates (olgun)")
  const seen = new Map<string, string>();
  for (const { name } of rows) {
    const normalized = name
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!seen.has(normalized)) {
      // Keep the original casing of the first occurrence
      seen.set(normalized, name.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim());
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.toLocaleLowerCase("tr-TR").localeCompare(b.toLocaleLowerCase("tr-TR"), "tr"),
  );
}
