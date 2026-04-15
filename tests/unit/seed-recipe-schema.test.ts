import { describe, expect, it } from "vitest";
import {
  seedRecipeSchema,
  validateSeedRecipes,
} from "@/lib/seed/recipe-schema";

const validRecipe = {
  title: "Test Tarifi",
  slug: "test-tarifi",
  emoji: "🍽️",
  description:
    "Bu bir test açıklamasıdır, yeterince uzun olması için birkaç kelime daha.",
  categorySlug: "et-yemekleri" as const,
  type: "YEMEK" as const,
  difficulty: "MEDIUM" as const,
  prepMinutes: 20,
  cookMinutes: 30,
  totalMinutes: 50,
  servingCount: 4,
  averageCalories: 400,
  protein: 25,
  carbs: 40,
  fat: 15,
  isFeatured: false,
  tipNote: null,
  servingSuggestion: null,
  tags: ["pratik"] as const,
  allergens: ["GLUTEN"] as const,
  ingredients: [
    { name: "Un", amount: "200", unit: "gr", sortOrder: 1 },
  ],
  steps: [
    { stepNumber: 1, instruction: "Unu yoğur." },
  ],
};

describe("seedRecipeSchema", () => {
  it("accepts a minimal valid recipe", () => {
    const r = seedRecipeSchema.safeParse(validRecipe);
    expect(r.success).toBe(true);
  });

  it("rejects a slug with Turkish characters", () => {
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      slug: "köfteli-sarma",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/TR karakter|slug/i);
    }
  });

  it("rejects a slug with uppercase", () => {
    expect(
      seedRecipeSchema.safeParse({ ...validRecipe, slug: "Test-Tarifi" })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown categorySlug", () => {
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      categorySlug: "bogus-category",
    });
    expect(r.success).toBe(false);
  });

  it("rejects unknown tag slug", () => {
    expect(
      seedRecipeSchema.safeParse({
        ...validRecipe,
        tags: ["bogus-tag"],
      }).success,
    ).toBe(false);
  });

  it("rejects unknown allergen enum value", () => {
    expect(
      seedRecipeSchema.safeParse({
        ...validRecipe,
        allergens: ["UNKNOWN_ALLERGEN"],
      }).success,
    ).toBe(false);
  });

  it("accepts empty allergens/tags defaults", () => {
    const raw = { ...validRecipe };
    // Remove optional fields to test defaults
    delete (raw as Partial<typeof validRecipe>).allergens;
    delete (raw as Partial<typeof validRecipe>).tags;
    const r = seedRecipeSchema.safeParse(raw);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.allergens).toEqual([]);
      expect(r.data.tags).toEqual([]);
    }
  });

  it("rejects too-short description", () => {
    expect(
      seedRecipeSchema.safeParse({ ...validRecipe, description: "Kısa." })
        .success,
    ).toBe(false);
  });

  it("rejects zero ingredients", () => {
    expect(
      seedRecipeSchema.safeParse({ ...validRecipe, ingredients: [] }).success,
    ).toBe(false);
  });

  it("rejects zero steps", () => {
    expect(
      seedRecipeSchema.safeParse({ ...validRecipe, steps: [] }).success,
    ).toBe(false);
  });

  it("warns via refine when prep+cook >> total", () => {
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      prepMinutes: 60,
      cookMinutes: 90,
      totalMinutes: 30, // wildly wrong
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/totalMinutes/i);
    }
  });

  it("allows a 15-minute fudge on prep+cook vs total", () => {
    // prep 20 + cook 30 = 50; total 40 → fudge = -10, within allowance
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      prepMinutes: 20,
      cookMinutes: 30,
      totalMinutes: 40,
    });
    expect(r.success).toBe(true);
  });
});

describe("seedRecipeSchema — translations (opt-in)", () => {
  it("accepts a recipe with no translations field at all", () => {
    const r = seedRecipeSchema.safeParse(validRecipe);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.translations).toBeUndefined();
  });

  it("accepts a recipe with en translation partial (title only)", () => {
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      translations: { en: { title: "Test Recipe" } },
    });
    expect(r.success).toBe(true);
  });

  it("accepts a full en translation (title + desc + ingredients + steps)", () => {
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      translations: {
        en: {
          title: "Test Recipe",
          description:
            "This is a test description that is long enough for validation.",
          tipNote: "Pro tip: cook with love.",
          servingSuggestion: "Serve hot.",
          ingredients: [{ sortOrder: 1, name: "Flour" }],
          steps: [{ stepNumber: 1, instruction: "Mix the flour." }],
        },
      },
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown locale code (3 letters)", () => {
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      translations: { eng: { title: "Test" } },
    });
    expect(r.success).toBe(false);
  });

  it("accepts multiple locales side by side", () => {
    const r = seedRecipeSchema.safeParse({
      ...validRecipe,
      translations: {
        en: { title: "Test" },
        de: { title: "Test auf Deutsch" },
      },
    });
    expect(r.success).toBe(true);
  });

  it("rejects too-short EN title (same constraints as TR)", () => {
    expect(
      seedRecipeSchema.safeParse({
        ...validRecipe,
        translations: { en: { title: "X" } },
      }).success,
    ).toBe(false);
  });
});

describe("validateSeedRecipes", () => {
  it("separates valid from invalid rows without throwing", () => {
    const { valid, errors } = validateSeedRecipes([
      validRecipe,
      { ...validRecipe, slug: "another-test" },
      { ...validRecipe, slug: "invalid-slug!!!" },
      { ...validRecipe, allergens: ["BOGUS"] },
    ]);
    expect(valid.length).toBe(2);
    expect(errors.length).toBe(2);
    expect(errors[0]?.index).toBe(2);
    expect(errors[1]?.index).toBe(3);
    expect(errors[0]?.message).toMatch(/slug/i);
  });

  it("returns an empty-valid + errors list when all rows are bad", () => {
    const { valid, errors } = validateSeedRecipes([
      { ...validRecipe, categorySlug: "x" },
      { broken: "object" },
    ]);
    expect(valid.length).toBe(0);
    expect(errors.length).toBe(2);
  });

  it("handles empty input", () => {
    const { valid, errors } = validateSeedRecipes([]);
    expect(valid).toEqual([]);
    expect(errors).toEqual([]);
  });
});
