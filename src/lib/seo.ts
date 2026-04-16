import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { CUISINE_LABEL, type CuisineCode } from "@/lib/cuisines";
import type { RecipeDetail } from "@/types/recipe";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Schema.org BreadcrumbList JSON-LD. Google Search "Ana sayfa › Tarifler
 * › Kategori › Tarif" şeridini sonuç kartının altına ekler — organik
 * CTR artırıcı rich result. Her breadcrumb item `@id` olarak tam URL
 * ister (relative path değil).
 *
 * Aggregate rating SKIP: Google Recipe rich results için gerçek kullanıcı
 * rating'i gerekir. Bookmark/like sayısı rating değil. Review system
 * eklenirse (Faz 3 kapsamı) o zaman `aggregateRating` + `review` array
 * eklenir — şimdilik yok.
 */
export function generateBreadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

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
    recipeCuisine: recipe.cuisine
      ? `${CUISINE_LABEL[recipe.cuisine as CuisineCode] ?? "Türk"} Mutfağı`
      : "Türk Mutfağı",
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
