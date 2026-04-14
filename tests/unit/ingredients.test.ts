import { describe, expect, it } from "vitest";
import {
  formatIngredient,
  INGREDIENT_UNITS,
  isStructuredIngredient,
  normaliseIngredients,
} from "@/lib/ingredients";

describe("normaliseIngredients", () => {
  it("returns [] for a non-array input", () => {
    expect(normaliseIngredients(null)).toEqual([]);
    expect(normaliseIngredients(undefined)).toEqual([]);
    expect(normaliseIngredients("not an array")).toEqual([]);
    expect(normaliseIngredients({ ingredients: [] })).toEqual([]);
  });

  it("coerces a legacy string[] to structured entries", () => {
    const out = normaliseIngredients([
      "2 adet patlıcan",
      "1 baş sarımsak",
      "  ", // blank — silently dropped
      "tuz",
    ]);
    expect(out).toEqual([
      { amount: "", unit: "", name: "2 adet patlıcan" },
      { amount: "", unit: "", name: "1 baş sarımsak" },
      { amount: "", unit: "", name: "tuz" },
    ]);
  });

  it("passes through well-formed structured entries", () => {
    const out = normaliseIngredients([
      { amount: "2", unit: "adet", name: "patlıcan" },
      { amount: "1", unit: "baş", name: "sarımsak" },
    ]);
    expect(out).toEqual([
      { amount: "2", unit: "adet", name: "patlıcan" },
      { amount: "1", unit: "baş", name: "sarımsak" },
    ]);
  });

  it("trims whitespace and drops entries with an empty name", () => {
    const out = normaliseIngredients([
      { amount: " 2 ", unit: " gr ", name: "  un  " },
      { amount: "", unit: "", name: "" }, // blank — dropped
      { amount: "x", unit: "y", name: "   " }, // whitespace-only name — dropped
    ]);
    expect(out).toEqual([{ amount: "2", unit: "gr", name: "un" }]);
  });

  it("handles mixed legacy + structured arrays gracefully", () => {
    const out = normaliseIngredients([
      "3 diş sarımsak",
      { amount: "200", unit: "gr", name: "kıyma" },
    ]);
    expect(out).toEqual([
      { amount: "", unit: "", name: "3 diş sarımsak" },
      { amount: "200", unit: "gr", name: "kıyma" },
    ]);
  });

  it("swallows malformed entries instead of throwing", () => {
    const out = normaliseIngredients([
      null,
      undefined,
      42,
      { amount: 1, unit: 2, name: 3 }, // non-string fields — name drops it
      { amount: "", unit: "", name: "geçerli" },
    ]);
    // Only the last entry has a valid string name; the object with numeric
    // fields gets filtered because its name isn't a non-empty string.
    expect(out.map((e) => e.name)).toEqual(["geçerli"]);
  });
});

describe("formatIngredient", () => {
  it("joins amount + unit + name with single spaces", () => {
    expect(
      formatIngredient({ amount: "2", unit: "yemek kaşığı", name: "un" }),
    ).toBe("2 yemek kaşığı un");
  });

  it("omits empty amount", () => {
    expect(formatIngredient({ amount: "", unit: "", name: "tuz" })).toBe("tuz");
  });

  it("omits empty unit but keeps amount + name", () => {
    expect(formatIngredient({ amount: "1", unit: "", name: "soğan" })).toBe(
      "1 soğan",
    );
  });

  it("trims surrounding whitespace on each part", () => {
    expect(
      formatIngredient({ amount: " 2 ", unit: " gr ", name: " un " }),
    ).toBe("2 gr un");
  });
});

describe("isStructuredIngredient", () => {
  it("returns true for objects with a string name field", () => {
    expect(isStructuredIngredient({ amount: "2", unit: "gr", name: "un" })).toBe(
      true,
    );
  });

  it("returns false for primitive / null / non-object inputs", () => {
    expect(isStructuredIngredient("raw string")).toBe(false);
    expect(isStructuredIngredient(null)).toBe(false);
    expect(isStructuredIngredient(42)).toBe(false);
  });

  it("returns false when name is missing or non-string", () => {
    expect(isStructuredIngredient({})).toBe(false);
    expect(isStructuredIngredient({ name: 42 })).toBe(false);
  });
});

describe("INGREDIENT_UNITS", () => {
  it("starts with an empty option so the select is opt-in", () => {
    expect(INGREDIENT_UNITS[0]).toBe("");
  });

  it("includes common Turkish kitchen units", () => {
    expect(INGREDIENT_UNITS).toContain("yemek kaşığı");
    expect(INGREDIENT_UNITS).toContain("su bardağı");
    expect(INGREDIENT_UNITS).toContain("adet");
    expect(INGREDIENT_UNITS).toContain("gr");
  });
});
