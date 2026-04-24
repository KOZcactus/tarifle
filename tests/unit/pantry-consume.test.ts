import { describe, expect, it } from "vitest";
import { computeConsume, type ConsumeStockItem } from "@/lib/pantry/consume";

const stock: ConsumeStockItem[] = [
  { id: "p1", ingredientName: "yumurta", quantity: 10, unit: "adet" },
  { id: "p2", ingredientName: "un", quantity: 500, unit: "gr" },
  { id: "p3", ingredientName: "süt", quantity: 1, unit: "lt" },
  { id: "p4", ingredientName: "tavuk göğsü", quantity: null, unit: null },
];

describe("computeConsume", () => {
  it("tek ingredient exact unit match", () => {
    const result = computeConsume(
      [{ name: "Yumurta", amount: "3", unit: "adet" }],
      2,
      2,
      stock,
    );
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]).toMatchObject({
      pantryItemId: "p1",
      before: 10,
      after: 7,
      amountUsed: 3,
      unit: "adet",
    });
  });

  it("unit conversion (gr to kg)", () => {
    const result = computeConsume(
      [{ name: "Un", amount: "0.1", unit: "kg" }],
      2,
      2,
      stock,
    );
    // 0.1 kg = 100 gr, stock 500 gr, after 400
    expect(result.decisions[0]).toMatchObject({ before: 500, after: 400, amountUsed: 100 });
  });

  it("scales when servingsCooked != recipeServingCount", () => {
    const result = computeConsume(
      [{ name: "Yumurta", amount: "4", unit: "adet" }],
      4, // recipe 4 kişilik
      2, // kullanıcı 2 kişilik pişirdi
      stock,
    );
    // 4 × (2/4) = 2 yumurta düşer
    expect(result.decisions[0]).toMatchObject({ before: 10, after: 8, amountUsed: 2 });
  });

  it("after clamped to 0 when requirement exceeds stock", () => {
    const result = computeConsume(
      [{ name: "Yumurta", amount: "15", unit: "adet" }],
      2,
      2,
      stock,
    );
    expect(result.decisions[0]).toMatchObject({ before: 10, after: 0, amountUsed: 10 });
  });

  it("notFoundRecipeIngredients fills when pantry missing", () => {
    const result = computeConsume(
      [{ name: "Tereyağı", amount: "100", unit: "gr" }],
      2,
      2,
      stock,
    );
    expect(result.decisions).toHaveLength(0);
    expect(result.notFoundRecipeIngredients).toContain("Tereyağı");
  });

  it("optional ingredient not in pantry does not go to notFound", () => {
    const result = computeConsume(
      [{ name: "Karabiber", amount: "1", unit: "tatlı kaşığı", isOptional: true }],
      2,
      2,
      stock,
    );
    expect(result.decisions).toHaveLength(0);
    expect(result.notFoundRecipeIngredients).toHaveLength(0);
  });

  it("skippedUnknownQuantity when pantry quantity null", () => {
    const result = computeConsume(
      [{ name: "Tavuk göğsü", amount: "500", unit: "gr" }],
      2,
      2,
      stock,
    );
    expect(result.decisions).toHaveLength(0);
    expect(result.skippedUnknownQuantity).toContain("tavuk göğsü");
  });

  it("skippedIncompatibleUnit when units do not convert", () => {
    const result = computeConsume(
      [{ name: "Un", amount: "1", unit: "adet" }],
      2,
      2,
      stock,
    );
    expect(result.decisions).toHaveLength(0);
    expect(result.skippedIncompatibleUnit).toContain("un");
  });

  it("unparseable amount skipped silently", () => {
    const result = computeConsume(
      [{ name: "Yumurta", amount: "tadınca", unit: null }],
      2,
      2,
      stock,
    );
    expect(result.decisions).toHaveLength(0);
    expect(result.notFoundRecipeIngredients).toHaveLength(0);
  });

  it("multi-ingredient: mix of found + not found", () => {
    const result = computeConsume(
      [
        { name: "Yumurta", amount: "2", unit: "adet" },
        { name: "Un", amount: "200", unit: "gr" },
        { name: "Maydanoz", amount: "1", unit: "demet" },
      ],
      4,
      4,
      stock,
    );
    expect(result.decisions).toHaveLength(2);
    expect(result.notFoundRecipeIngredients).toContain("Maydanoz");
  });
});
