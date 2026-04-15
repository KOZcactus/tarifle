import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { RecipeCard as RecipeCardType } from "@/types/recipe";

/**
 * "Benzer tarifler" card row for the recipe detail page footer.
 *
 * Rendering contract:
 *   - If `recipes` is empty → render NOTHING (no empty state copy).
 *     The detail page already has plenty of content; an "öneri yok"
 *     block would just add noise at the bottom.
 *   - Otherwise: 2-3-4 column responsive grid, mirroring /tarifler
 *     listing so visual rhythm matches.
 *
 * Consumers hydrate `recipes` via `getSimilarRecipes(recipeId, limit)`
 * in the page server component.
 */
interface SimilarRecipesProps {
  recipes: RecipeCardType[];
}

export function SimilarRecipes({ recipes }: SimilarRecipesProps) {
  if (recipes.length === 0) return null;

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
          Benzer tarifler
        </h2>
        <p className="text-sm text-text-muted">
          Aynı kategoriden ve etiketlerden seçildi
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}
