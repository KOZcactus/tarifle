import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Returns a combined list of recipe titles and unique ingredient names
 * for search autocomplete. Cached 10 dk, yeni seed sonrası auto-stale ama
 * her pageview'da 1400+ title + 690 ingredient query'si ağır, TTL değeri
 * büyük. Homepage + /kesfet + navbar SearchBar hepsi bunu tüketiyor.
 *
 * Returns ~1400 titles + ~690 ingredients ≈ ~2100 suggestions.
 * Client filters these by typed query, no API call per keystroke.
 */
export const getSearchSuggestions = unstable_cache(
  async (): Promise<{
    recipes: string[];
    ingredients: string[];
  }> => {
    const [recipeTitles, ingredientRows] = await Promise.all([
      prisma.recipe.findMany({
        where: { status: "PUBLISHED" },
        select: { title: true },
        orderBy: { title: "asc" },
      }),
      prisma.recipeIngredient.findMany({
        where: { recipe: { status: "PUBLISHED" } },
        select: { name: true },
        distinct: ["name"],
        orderBy: { name: "asc" },
      }),
    ]);

    // Deduplicate ingredient names (normalize parens)
    const seen = new Set<string>();
    const ingredients: string[] = [];
    for (const { name } of ingredientRows) {
      const clean = name.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
      const key = clean.toLocaleLowerCase("tr-TR");
      if (!seen.has(key)) {
        seen.add(key);
        ingredients.push(clean);
      }
    }

    return {
      recipes: recipeTitles.map((r) => r.title),
      ingredients,
    };
  },
  ["search-suggestions-v1"],
  { revalidate: 600, tags: ["search-suggestions"] },
);
