import { describe, test, expect } from "vitest";
import { generateRecipeFaqJsonLd } from "@/lib/seo";
import type { RecipeDetail } from "@/types/recipe";

// Narrow the JSON-LD shape returned by generateRecipeFaqJsonLd so tests
// can assert on `mainEntity` without widening to `any`. Keeps the schema
// contract visible in the test file itself.
interface FaqQuestion {
  name: string;
  acceptedAnswer: { text: string };
}
interface FaqJsonLd {
  "@type": "FAQPage";
  mainEntity: FaqQuestion[];
}

const baseRecipe: RecipeDetail = {
  id: "1",
  title: "Test Tarif",
  slug: "test-tarif",
  description: "Test açıklama",
  emoji: "🍽️",
  type: "YEMEK",
  difficulty: "MEDIUM",
  prepMinutes: 15,
  cookMinutes: 30,
  totalMinutes: 45,
  servingCount: 4,
  averageCalories: 350,
  protein: 25,
  carbs: 30,
  fat: 15,
  imageUrl: null,
  videoUrl: null,
  status: "PUBLISHED",
  viewCount: 100,
  tipNote: null,
  servingSuggestion: null,
  allergens: ["GLUTEN", "SUT"],
  cuisine: "tr",
  translations: null,
  createdAt: "2026-01-01",
  category: { id: "c1", name: "Et Yemekleri", slug: "et-yemekleri", emoji: "🥩" },
  ingredients: [
    { id: "i1", name: "Dana kıyma", amount: "500", unit: "gr", sortOrder: 1, isOptional: false, group: null },
    { id: "i2", name: "Soğan", amount: "2", unit: "adet", sortOrder: 2, isOptional: false, group: null },
  ],
  steps: [
    { id: "s1", stepNumber: 1, instruction: "Kıymayı kavurun.", tip: null, imageUrl: null, timerSeconds: null },
  ],
  tags: [],
  variations: [],
  _count: { variations: 0, bookmarks: 0, reviews: 0 },
};

describe("generateRecipeFaqJsonLd", () => {
  test("generates FAQPage with correct @type", () => {
    const result = generateRecipeFaqJsonLd(baseRecipe);
    expect(result).not.toBeNull();
    expect((result as FaqJsonLd)["@type"]).toBe("FAQPage");
  });

  test("includes serving count question", () => {
    const result = generateRecipeFaqJsonLd(baseRecipe) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).toContain("Test Tarif kaç kişilik?");
  });

  test("includes duration question", () => {
    const result = generateRecipeFaqJsonLd(baseRecipe) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).toContain("Test Tarif ne kadar sürer?");
  });

  test("includes calorie question when nutrition exists", () => {
    const result = generateRecipeFaqJsonLd(baseRecipe) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).toContain("Test Tarif kaç kalori?");
  });

  test("skips calorie question when no nutrition", () => {
    const noNutrition = { ...baseRecipe, averageCalories: null };
    const result = generateRecipeFaqJsonLd(noNutrition) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).not.toContain("Test Tarif kaç kalori?");
  });

  test("includes allergen question when allergens exist", () => {
    const result = generateRecipeFaqJsonLd(baseRecipe) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).toContain("Test Tarif hangi alerjenleri içerir?");
  });

  test("skips allergen question when no allergens", () => {
    const noAllergens = { ...baseRecipe, allergens: [] };
    const result = generateRecipeFaqJsonLd(noAllergens) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).not.toContain("Test Tarif hangi alerjenleri içerir?");
  });

  test("includes cuisine question for international recipes", () => {
    const japanese = { ...baseRecipe, cuisine: "jp" };
    const result = generateRecipeFaqJsonLd(japanese) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).toContain("Test Tarif hangi mutfağa ait?");
  });

  test("skips cuisine question for Turkish recipes", () => {
    const result = generateRecipeFaqJsonLd(baseRecipe) as FaqJsonLd;
    const questions = result.mainEntity.map((q: FaqQuestion) => q.name);
    expect(questions).not.toContain("Test Tarif hangi mutfağa ait?");
  });

  test("includes ingredient count question", () => {
    const result = generateRecipeFaqJsonLd(baseRecipe) as FaqJsonLd;
    const answers = result.mainEntity.map((q: FaqQuestion) => q.acceptedAnswer.text);
    expect(answers.some((a: string) => a.includes("2 malzeme"))).toBe(true);
  });
});
