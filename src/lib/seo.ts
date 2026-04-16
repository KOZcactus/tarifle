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

/**
 * Schema.org FAQPage JSON-LD — auto-generated from recipe data.
 * Google SERP'te FAQ rich results gösterir. Sıfır içerik yazma,
 * tamamen data-driven.
 */
export function generateRecipeFaqJsonLd(recipe: RecipeDetail): object | null {
  const cuisineLabel = recipe.cuisine
    ? CUISINE_LABEL[recipe.cuisine as CuisineCode]
    : null;

  const faqs: { question: string; answer: string }[] = [];

  // 1. Porsiyon
  faqs.push({
    question: `${recipe.title} kaç kişilik?`,
    answer: `Bu tarif ${recipe.servingCount} kişiliktir.`,
  });

  // 2. Süre
  faqs.push({
    question: `${recipe.title} ne kadar sürer?`,
    answer: `Hazırlık ${recipe.prepMinutes} dakika, pişirme ${recipe.cookMinutes} dakika olmak üzere toplam ${recipe.totalMinutes} dakika sürer.`,
  });

  // 3. Zorluk
  const diffLabel =
    recipe.difficulty === "EASY" ? "kolay" :
    recipe.difficulty === "MEDIUM" ? "orta" : "zor";
  faqs.push({
    question: `${recipe.title} zor mu?`,
    answer: `Bu tarif ${diffLabel} seviyededir.`,
  });

  // 4. Kalori (varsa)
  if (recipe.averageCalories) {
    faqs.push({
      question: `${recipe.title} kaç kalori?`,
      answer: `Porsiyon başına yaklaşık ${recipe.averageCalories} kcal'dir.${
        recipe.protein ? ` Protein: ${recipe.protein}g, karbonhidrat: ${recipe.carbs}g, yağ: ${recipe.fat}g.` : ""
      }`,
    });
  }

  // 5. Alerjen (varsa)
  if (recipe.allergens.length > 0) {
    const allergenNames = recipe.allergens.map((a) => {
      const map: Record<string, string> = {
        GLUTEN: "gluten", SUT: "süt ürünleri", YUMURTA: "yumurta",
        KUSUYEMIS: "kuruyemiş", YER_FISTIGI: "yer fıstığı", SOYA: "soya",
        DENIZ_URUNLERI: "deniz ürünleri", SUSAM: "susam",
        KEREVIZ: "kereviz", HARDAL: "hardal",
      };
      return map[a] ?? a;
    });
    faqs.push({
      question: `${recipe.title} hangi alerjenleri içerir?`,
      answer: `Bu tarif ${allergenNames.join(", ")} içerir.`,
    });
  }

  // 6. Mutfak (uluslararası ise)
  if (cuisineLabel && recipe.cuisine !== "tr") {
    faqs.push({
      question: `${recipe.title} hangi mutfağa ait?`,
      answer: `Bu tarif ${cuisineLabel} mutfağına aittir.`,
    });
  }

  // 7. Malzeme sayısı
  faqs.push({
    question: `${recipe.title} için kaç malzeme gerekiyor?`,
    answer: `Bu tarif için ${recipe.ingredients.length} malzeme gereklidir.`,
  });

  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
