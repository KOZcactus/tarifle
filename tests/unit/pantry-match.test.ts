import { describe, expect, it } from "vitest";
import {
  parseAmount,
  normalizeUnit,
  convertAmount,
  matchIngredient,
  computePantryMatch,
  summaryBadgeLabel,
  toPantryStock,
  type PantryStockItem,
  type RecipeRequirement,
} from "@/lib/pantry/match";

describe("parseAmount", () => {
  it.each([
    ["500", 500],
    ["2.5", 2.5],
    ["2,5", 2.5],
    ["1/2", 0.5],
    ["1 1/2", 1.5],
    ["yarım", 0.5],
    ["yarim", 0.5],
    ["çeyrek", 0.25],
  ])("parses %s as %d", (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it.each([null, undefined, "", "abc"])("returns null for invalid input %s", (raw) => {
    expect(parseAmount(raw as string | null | undefined)).toBeNull();
  });
});

describe("normalizeUnit", () => {
  it.each([
    ["gr", "gr"],
    ["Gram", "gr"],
    ["KG", "kg"],
    ["kilo", "kg"],
    ["ml", "ml"],
    ["litre", "lt"],
    ["adet", "adet"],
    ["Tane", "adet"],
    ["yemek kaşığı", "yemek kasigi"],
  ])("normalizes %s as %s", (raw, expected) => {
    expect(normalizeUnit(raw)).toBe(expected);
  });

  it.each([null, undefined, ""])("returns null for %s", (raw) => {
    expect(normalizeUnit(raw as string | null | undefined)).toBeNull();
  });
});

describe("convertAmount", () => {
  it("converts gr to kg", () => {
    expect(convertAmount(1000, "gr", "kg")).toBe(1);
  });

  it("converts kg to gr", () => {
    expect(convertAmount(2, "kg", "gr")).toBe(2000);
  });

  it("converts ml to lt", () => {
    expect(convertAmount(500, "ml", "lt")).toBe(0.5);
  });

  it("returns null for incompatible units (gr to adet)", () => {
    expect(convertAmount(500, "gr", "adet")).toBeNull();
  });

  it("returns same amount for same unit", () => {
    expect(convertAmount(5, "adet", "adet")).toBe(5);
  });
});

describe("matchIngredient", () => {
  const stock: PantryStockItem[] = [
    { ingredientName: "yumurta", quantity: 2, unit: "adet" },
    { ingredientName: "un", quantity: 500, unit: "gr" },
    { ingredientName: "tavuk göğsü", quantity: null, unit: null },
  ];

  it("status=missing when ingredient not in pantry", () => {
    const result = matchIngredient(
      { name: "Süt", amount: "1", unit: "lt" },
      stock,
    );
    expect(result.status).toBe("missing");
    expect(result.available).toBeNull();
  });

  it("status=partial when pantry has less than required (same unit)", () => {
    const result = matchIngredient(
      { name: "Yumurta", amount: "5", unit: "adet" },
      stock,
    );
    expect(result.status).toBe("partial");
    expect(result.required).toBe(5);
    expect(result.available).toBe(2);
    expect(result.shortage).toBe(3);
  });

  it("status=covered when pantry has enough (same unit)", () => {
    const result = matchIngredient(
      { name: "Un", amount: "200", unit: "gr" },
      stock,
    );
    expect(result.status).toBe("covered");
    expect(result.shortage).toBe(0);
  });

  it("status=covered with unit conversion (gr vs kg)", () => {
    const result = matchIngredient(
      { name: "Un", amount: "0.3", unit: "kg" },
      stock,
    );
    expect(result.status).toBe("covered");
    // 500 gr → 0.5 kg, required 0.3 kg
    expect(result.available).toBe(0.5);
  });

  it("status=present_unknown when pantry quantity is null", () => {
    const result = matchIngredient(
      { name: "Tavuk göğsü", amount: "500", unit: "gr" },
      stock,
    );
    expect(result.status).toBe("present_unknown");
  });

  it("status=present_unknown when units are incompatible", () => {
    // Recipe needs "1 adet" but stock has gr
    const result = matchIngredient(
      { name: "Un", amount: "1", unit: "adet" },
      stock,
    );
    expect(result.status).toBe("present_unknown");
  });
});

describe("computePantryMatch", () => {
  const stock: PantryStockItem[] = [
    { ingredientName: "yumurta", quantity: 2, unit: "adet" },
    { ingredientName: "un", quantity: 500, unit: "gr" },
    { ingredientName: "süt", quantity: 1, unit: "lt" },
  ];

  it("counts each status correctly", () => {
    const recipe: RecipeRequirement[] = [
      { name: "Yumurta", amount: "5", unit: "adet" }, // partial (2/5)
      { name: "Un", amount: "200", unit: "gr" }, // covered
      { name: "Süt", amount: "500", unit: "ml" }, // covered (1 lt → 1000 ml)
      { name: "Tereyağı", amount: "100", unit: "gr" }, // missing
    ];
    const summary = computePantryMatch(recipe, stock);
    expect(summary.total).toBe(4);
    expect(summary.covered).toBe(2);
    expect(summary.partial).toBe(1);
    expect(summary.missing).toBe(1);
    expect(summary.presentUnknown).toBe(0);
  });

  it("excludes optional ingredients from total", () => {
    const recipe: RecipeRequirement[] = [
      { name: "Un", amount: "100", unit: "gr" }, // required, covered
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı", isOptional: true },
    ];
    const summary = computePantryMatch(recipe, stock);
    expect(summary.total).toBe(1);
  });

  it("shortages list populated only for partial", () => {
    const recipe: RecipeRequirement[] = [
      { name: "Yumurta", amount: "5", unit: "adet" }, // partial (needs 3 more)
      { name: "Un", amount: "2000", unit: "gr" }, // partial (needs 1500 more)
    ];
    const summary = computePantryMatch(recipe, stock);
    expect(summary.shortages).toHaveLength(2);
    expect(summary.shortages[0]?.shortage).toBe(3);
    expect(summary.shortages[1]?.shortage).toBe(1500);
  });

  it("completionRate 1.0 when all covered + presentUnknown", () => {
    const recipe: RecipeRequirement[] = [
      { name: "Un", amount: "100", unit: "gr" },
    ];
    const summary = computePantryMatch(recipe, stock);
    expect(summary.completionRate).toBe(1);
  });
});

describe("summaryBadgeLabel", () => {
  it("returns tam uyuyor message when all covered", () => {
    const summary = {
      total: 5,
      covered: 5,
      partial: 0,
      presentUnknown: 0,
      missing: 0,
      completionRate: 1,
      details: [],
      shortages: [],
    };
    expect(summaryBadgeLabel(summary)).toBe("Dolabına tam uyuyor");
  });

  it("reports missing count", () => {
    const summary = {
      total: 10,
      covered: 7,
      partial: 0,
      presentUnknown: 0,
      missing: 3,
      completionRate: 0.7,
      details: [],
      shortages: [],
    };
    expect(summaryBadgeLabel(summary)).toBe("7/10 dolabında");
  });

  it("reports partial count", () => {
    const summary = {
      total: 5,
      covered: 3,
      partial: 2,
      presentUnknown: 0,
      missing: 0,
      completionRate: 1,
      details: [],
      shortages: [],
    };
    expect(summaryBadgeLabel(summary)).toBe("5/5 var, 2 miktar kısmi");
  });
});

describe("toPantryStock", () => {
  it("converts Decimal quantity to number", () => {
    const items = [
      {
        ingredientName: "Yumurta",
        quantity: { toNumber: () => 2.5 },
        unit: "adet",
      },
    ];
    const stock = toPantryStock(items);
    expect(stock[0]?.quantity).toBe(2.5);
    expect(stock[0]?.ingredientName).toBe("yumurta");
  });

  it("handles null quantity", () => {
    const items = [{ ingredientName: "un", quantity: null, unit: null }];
    const stock = toPantryStock(items);
    expect(stock[0]?.quantity).toBeNull();
  });

  it("passes through number quantity", () => {
    const items = [{ ingredientName: "un", quantity: 500, unit: "gr" }];
    const stock = toPantryStock(items);
    expect(stock[0]?.quantity).toBe(500);
  });
});
