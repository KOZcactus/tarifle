import { prisma } from "@/lib/prisma";

/**
 * Returns a combined list of recipe titles and unique ingredient names
 * for search autocomplete. Cached by Next.js — re-fetched on deploy.
 *
 * Returns ~800 titles + ~690 ingredients ≈ ~1500 suggestions.
 * Client filters these by typed query — no API call per keystroke.
 */
export async function getSearchSuggestions(): Promise<{
  recipes: string[];
  ingredients: string[];
}> {
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
}
