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

export interface AggregateRatingInput {
  /** Average 0-5, one decimal. */
  average: number;
  /** Total count of published reviews. */
  count: number;
}

/**
 * Adım metninden kısa `name` türet — HowToStep.name Google rich result'ta
 * "step 1 of 5" başlığı olarak görünür. İlk cümlenin ilk 60 karakteri +
 * fallback "Adım N".
 */
function stepNameFromInstruction(instruction: string, position: number): string {
  const firstSentence = instruction.split(/[.!?]/)[0]?.trim() ?? "";
  if (firstSentence.length === 0) return `Adım ${position}`;
  if (firstSentence.length <= 60) return firstSentence;
  return firstSentence.slice(0, 57).trimEnd() + "…";
}

/**
 * Kural-tabanlı `tool` inference — tarif adım metinlerinden ve tag
 * listesinden ortak mutfak ekipmanlarını çıkarır. HowTo schema'nın
 * `tool` property'si Recipe'de de geçerli (inheritance). Google rich
 * snippet'te doğrudan görünmez ama structured data zenginliği artar.
 *
 * Eşleşme sırası önemli değil — Set ile unique, sonra alfabetik.
 */
const TOOL_PATTERNS: readonly { pattern: RegExp; tool: string }[] = [
  { pattern: /\bfırın/i, tool: "Fırın" },
  { pattern: /\btavada?\b|\btavaya\b|\btavay[aı]\b/i, tool: "Tava" },
  { pattern: /\btencere/i, tool: "Tencere" },
  { pattern: /\b(blender|robot|mutfak robot)/i, tool: "Blender / Mutfak robotu" },
  { pattern: /\b(çırpıcı|mikser)/i, tool: "Mikser / Çırpıcı" },
  { pattern: /\b(buzdolab|dolapta|dinlen)/i, tool: "Buzdolabı" },
  { pattern: /\bdüdüklü/i, tool: "Düdüklü tencere" },
  { pattern: /\bızgara/i, tool: "Izgara" },
  { pattern: /\b(waffle makinesi|gofret makinesi)/i, tool: "Waffle makinesi" },
];

function inferToolsFromSteps(
  steps: readonly { instruction: string }[],
): string[] {
  const found = new Set<string>();
  for (const step of steps) {
    for (const { pattern, tool } of TOOL_PATTERNS) {
      if (pattern.test(step.instruction)) found.add(tool);
    }
  }
  return Array.from(found).sort();
}

export function generateRecipeJsonLd(
  recipe: RecipeDetail,
  aggregateRating?: AggregateRatingInput | null,
) {
  const totalTime = `PT${recipe.totalMinutes}M`;
  const prepTime = `PT${recipe.prepMinutes}M`;
  const cookTime = `PT${recipe.cookMinutes}M`;

  const tools = inferToolsFromSteps(recipe.steps);

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
    // HowToSupply — schema.org'da Recipe HowTo'dan inherit eder. Malzeme
    // listesinin yapısal versiyonu; recipeIngredient flat string kalsa da
    // supply object array HowTo-style structured data sağlar.
    supply: recipe.ingredients.map((ing) => ({
      "@type": "HowToSupply",
      name: ing.name,
      requiredQuantity: {
        "@type": "QuantitativeValue",
        value: ing.amount,
        ...(ing.unit ? { unitText: ing.unit } : {}),
      },
    })),
    // HowToTool — adım metinlerinden inference edilen mutfak ekipmanı.
    // Sıfırsa emit etme (schema temiz kalsın).
    ...(tools.length > 0
      ? {
          tool: tools.map((name) => ({ "@type": "HowToTool", name })),
        }
      : {}),
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      name: stepNameFromInstruction(step.instruction, step.stepNumber),
      text: step.instruction,
      url: `${SITE_URL}/tarif/${recipe.slug}#step-${step.stepNumber}`,
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
    // AggregateRating only emitted when real review data exists — Google
    // structured-data abuse guard: fake/bookmark-based ratings are flagged.
    ...(aggregateRating && aggregateRating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: aggregateRating.average.toFixed(1),
            reviewCount: aggregateRating.count,
            bestRating: "5",
            worstRating: "1",
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
/**
 * Category FAQ JSON-LD — auto-generated from category stats.
 */
export function generateCategoryFaqJsonLd(
  categoryName: string,
  recipeCount: number,
): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${categoryName} kategorisinde kaç tarif var?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${categoryName} kategorisinde şu an ${recipeCount} tarif bulunuyor.`,
        },
      },
      {
        "@type": "Question",
        name: `${categoryName} tarifleri nasıl filtrelenir?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${categoryName} tariflerini mutfak, alerjen ve diyet tercihine göre filtreleyebilirsiniz.`,
        },
      },
    ],
  };
}

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
