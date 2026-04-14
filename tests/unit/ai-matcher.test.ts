import { describe, expect, it } from "vitest";
import {
  computeMatch,
  ingredientMatches,
  isPantryStaple,
  normalizeIngredient,
} from "@/lib/ai/matcher";

describe("normalizeIngredient", () => {
  it("lowercases with Turkish locale", () => {
    expect(normalizeIngredient("İSOT")).toBe("isot");
    expect(normalizeIngredient("IŞIK")).toBe("ışık");
  });

  it("strips parenthetical modifiers", () => {
    expect(normalizeIngredient("domates (olgun)")).toBe("domates");
    expect(normalizeIngredient("un (tam buğday)")).toBe("un");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeIngredient("zeytin  yağı")).toBe("zeytin yağı");
  });
});

describe("ingredientMatches", () => {
  it("matches identical ingredients", () => {
    expect(ingredientMatches("domates", "domates")).toBe(true);
  });

  it("uses prefix matching so 'domates' matches 'çeri domates'", () => {
    expect(ingredientMatches("çeri domates", "domates")).toBe(true);
  });

  it("does not false-positive on arbitrary substrings", () => {
    // "limon" must not match "helimonik" — prefix rule blocks this.
    expect(ingredientMatches("helimonik", "limon")).toBe(false);
  });

  it("matches multi-word user input against multi-word recipe ingredient", () => {
    expect(ingredientMatches("zeytin yağı", "zeytin yağı")).toBe(true);
  });

  it("requires every user token to hit a recipe token", () => {
    // User says "tavuk göğsü" — recipe has just "tavuk" → should NOT match
    // because "göğsü" finds no counterpart. Otherwise the ingredient "tavuk"
    // in a stew would be claimed by someone who only has a chicken breast.
    expect(ingredientMatches("tavuk", "tavuk göğsü")).toBe(false);
  });

  it("returns false when either side is empty", () => {
    expect(ingredientMatches("", "domates")).toBe(false);
    expect(ingredientMatches("domates", "")).toBe(false);
  });
});

describe("isPantryStaple", () => {
  it("recognises core staples", () => {
    expect(isPantryStaple("tuz")).toBe(true);
    expect(isPantryStaple("karabiber")).toBe(true);
    expect(isPantryStaple("su")).toBe(true);
  });

  it("recognises oil variations", () => {
    expect(isPantryStaple("sıvı yağ")).toBe(true);
    expect(isPantryStaple("zeytinyağı")).toBe(true);
  });

  it("rejects non-staples", () => {
    expect(isPantryStaple("domates")).toBe(false);
    expect(isPantryStaple("kıyma")).toBe(false);
  });
});

describe("computeMatch", () => {
  const recipeIngs = [
    { name: "domates", isOptional: false },
    { name: "soğan", isOptional: false },
    { name: "yumurta", isOptional: false },
    { name: "maydanoz", isOptional: true },
  ];

  it("scores 1.0 when every required ingredient is present", () => {
    const result = computeMatch(recipeIngs, ["domates", "soğan", "yumurta"]);
    expect(result.score).toBe(1);
    expect(result.missing).toEqual([]);
    expect(result.matched).toHaveLength(3);
  });

  it("excludes optional ingredients from score but still reports matches", () => {
    const result = computeMatch(recipeIngs, [
      "domates",
      "soğan",
      "yumurta",
      "maydanoz",
    ]);
    expect(result.matched).toContain("maydanoz");
    expect(result.score).toBe(1);
  });

  it("optional missing does NOT appear in missing list", () => {
    const result = computeMatch(recipeIngs, ["domates", "soğan", "yumurta"]);
    expect(result.missing).not.toContain("maydanoz");
  });

  it("scores proportionally when some required ingredients are missing", () => {
    const result = computeMatch(recipeIngs, ["domates", "soğan"]);
    expect(result.score).toBeCloseTo(2 / 3, 5);
    expect(result.missing).toContain("yumurta");
  });

  it("scores 0 when no required ingredient matches", () => {
    const result = computeMatch(recipeIngs, ["elma", "armut"]);
    expect(result.score).toBe(0);
    expect(result.missing).toHaveLength(3);
  });

  it("treats pantry staples as matched when opt-in is true", () => {
    const withStaples = [
      { name: "domates", isOptional: false },
      { name: "tuz", isOptional: false },
      { name: "karabiber", isOptional: false },
    ];
    const result = computeMatch(withStaples, ["domates"], {
      assumePantryStaples: true,
    });
    expect(result.score).toBe(1);
    expect(result.matched).toContain("tuz");
    expect(result.matched).toContain("karabiber");
  });

  it("pantry staples are still required when opt-in is false", () => {
    const withStaples = [
      { name: "domates", isOptional: false },
      { name: "tuz", isOptional: false },
    ];
    const result = computeMatch(withStaples, ["domates"]);
    expect(result.score).toBe(0.5);
    expect(result.missing).toContain("tuz");
  });

  it("handles recipe with only optional ingredients as score 0", () => {
    const allOptional = [
      { name: "nane", isOptional: true },
      { name: "fesleğen", isOptional: true },
    ];
    const result = computeMatch(allOptional, ["nane"]);
    // No required ingredients → score is 0 by convention (see matcher.ts)
    expect(result.score).toBe(0);
  });
});
