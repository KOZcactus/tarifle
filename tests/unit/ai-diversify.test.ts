import { describe, expect, it } from "vitest";
import { diversifySuggestions } from "@/lib/ai/rule-based-provider";
import type { AiSuggestion } from "@/lib/ai/types";

function mk(
  slug: string,
  categoryName: string,
  cuisine: string | null,
  score: number,
): AiSuggestion {
  return {
    recipeId: slug,
    slug,
    title: slug,
    emoji: null,
    imageUrl: null,
    categoryName,
    cuisine,
    difficulty: "EASY",
    totalMinutes: 20,
    servingCount: 4,
    averageCalories: null,
    hungerBar: null,
    matchScore: score,
    matchedIngredients: [],
    missingIngredients: [],
    tags: [],
  };
}

describe("diversifySuggestions", () => {
  it("dedupes duplicate slugs", () => {
    const input = [
      mk("a", "Cat1", "tr", 0.9),
      mk("a", "Cat1", "tr", 0.9),
      mk("b", "Cat2", "it", 0.8),
    ];
    const result = diversifySuggestions(input, 10);
    expect(result.map((r) => r.slug)).toEqual(["a", "b"]);
  });

  it("enforces max 2 per category in ilk 10", () => {
    const input = [
      mk("a", "Tatlılar", "tr", 0.9),
      mk("b", "Tatlılar", "it", 0.88),
      mk("c", "Tatlılar", "fr", 0.86), // 3rd dessert, overflow
      mk("d", "Yemek", "tr", 0.8),
      mk("e", "Yemek", "it", 0.7),
    ];
    const result = diversifySuggestions(input, 4);
    // c overflow; d ve e eklenir; sonra slot varsa c gelir
    expect(result.map((r) => r.slug)).toEqual(["a", "b", "d", "e"]);
  });

  it("enforces max 3 per cuisine", () => {
    const input = [
      mk("a", "Cat1", "tr", 0.9),
      mk("b", "Cat2", "tr", 0.85),
      mk("c", "Cat3", "tr", 0.8),
      mk("d", "Cat4", "tr", 0.78), // 4. Türk, overflow
      mk("e", "Cat5", "it", 0.75),
      mk("f", "Cat6", "fr", 0.7),
    ];
    const result = diversifySuggestions(input, 5);
    // 4. Türk overflow. İlk pass: a, b, c, e, f (5 tane, limit doldu).
    // d gelmez çünkü limit zaten doldu.
    expect(result.map((r) => r.slug)).toEqual(["a", "b", "c", "e", "f"]);
  });

  it("null cuisine doesn't count toward cuisine cap", () => {
    const input = [
      mk("a", "Cat1", null, 0.9),
      mk("b", "Cat2", null, 0.85),
      mk("c", "Cat3", null, 0.8),
      mk("d", "Cat4", null, 0.75), // null cuisine, cap'e sayılmaz
    ];
    const result = diversifySuggestions(input, 10);
    expect(result.map((r) => r.slug)).toEqual(["a", "b", "c", "d"]);
  });

  it("fills from overflow when primary incomplete", () => {
    const input = [
      mk("a", "Tatlılar", "tr", 0.9),
      mk("b", "Tatlılar", "tr", 0.85),
      mk("c", "Tatlılar", "tr", 0.8), // aynı kategori + cuisine
      mk("d", "Tatlılar", "tr", 0.78),
    ];
    // Primary: a, b (max 2 per category); overflow: c, d
    // limit 4, primary 2, overflow'dan 2 daha → a, b, c, d
    const result = diversifySuggestions(input, 4);
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.slug)).toEqual(["a", "b", "c", "d"]);
  });

  it("preserves score order", () => {
    const input = [
      mk("high", "Cat1", "tr", 0.95),
      mk("mid", "Cat2", "it", 0.7),
      mk("low", "Cat3", "fr", 0.5),
    ];
    const result = diversifySuggestions(input, 10);
    expect(result.map((r) => r.slug)).toEqual(["high", "mid", "low"]);
  });
});
