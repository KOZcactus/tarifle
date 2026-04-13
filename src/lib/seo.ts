import { SITE_NAME, SITE_URL } from "@/lib/constants";
import type { RecipeDetail } from "@/types/recipe";

export function generateRecipeJsonLd(recipe: RecipeDetail) {
  const totalTime = `PT${recipe.totalMinutes}M`;
  const prepTime = `PT${recipe.prepMinutes}M`;
  const cookTime = `PT${recipe.cookMinutes}M`;

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: recipe.imageUrl ?? `${SITE_URL}/images/og-image.png`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    datePublished: recipe.createdAt,
    prepTime,
    cookTime,
    totalTime,
    recipeYield: `${recipe.servingCount} porsiyon`,
    recipeCategory: recipe.category.name,
    recipeCuisine: "Türk Mutfağı",
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${ing.amount} ${ing.unit ?? ""} ${ing.name}`.trim(),
    ),
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      text: step.instruction,
      ...(step.tip ? { tip: step.tip } : {}),
    })),
    ...(recipe.averageCalories
      ? {
          nutrition: {
            "@type": "NutritionInformation",
            calories: `${recipe.averageCalories} calories`,
            ...(recipe.protein ? { proteinContent: `${recipe.protein}g` } : {}),
            ...(recipe.carbs ? { carbohydrateContent: `${recipe.carbs}g` } : {}),
            ...(recipe.fat ? { fatContent: `${recipe.fat}g` } : {}),
          },
        }
      : {}),
    keywords: recipe.tags.map((t) => t.tag.name).join(", "),
  };
}
