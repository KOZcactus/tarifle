import { getTranslations } from "next-intl/server";
import type { SimilarRecipeCard } from "@/lib/queries/similar-recipes";
import { SimilarRecipesClient } from "@/components/recipe/SimilarRecipesClient";

/**
 * "Benzer tarifler" card row for the recipe detail page footer.
 *
 * Rendering contract:
 *   - If `recipes` is empty → render NOTHING (no empty state copy).
 *     The detail page already has plenty of content; an "öneri yok"
 *     block would just add noise at the bottom.
 *   - Otherwise: section header + I-chip filter row (client) + 2-3-4
 *     column grid, visual rhythm /tarifler listing'i izler.
 */
interface SimilarRecipesProps {
  recipes: SimilarRecipeCard[];
}

export async function SimilarRecipes({ recipes }: SimilarRecipesProps) {
  if (recipes.length === 0) return null;
  const t = await getTranslations("similarRecipes");

  return (
    <section
      className="mt-16 border-t border-border pt-10"
      aria-labelledby="similar-recipes-heading"
    >
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2
          id="similar-recipes-heading"
          className="font-heading text-2xl font-bold"
        >
          {t("title")}
        </h2>
        <p className="text-sm text-text-muted">{t("subtitle")}</p>
      </div>
      <SimilarRecipesClient recipes={recipes} />
    </section>
  );
}
