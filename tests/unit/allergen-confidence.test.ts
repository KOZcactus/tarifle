import { describe, expect, it } from "vitest";
import { computeAllergenConfidence } from "@/lib/recipe/allergen-confidence";

describe("computeAllergenConfidence", () => {
  it("inSync when declared matches inferred", () => {
    const result = computeAllergenConfidence(
      ["GLUTEN", "SUT"],
      [{ name: "un" }, { name: "süt" }, { name: "tuz" }],
    );
    expect(result.inSync).toBe(true);
    expect(result.extraInferred).toEqual([]);
    expect(result.extraDeclared).toEqual([]);
  });

  it("flags extraInferred when ingredient implies allergen but tag missing", () => {
    const result = computeAllergenConfidence(
      [],
      [{ name: "un" }, { name: "yumurta" }, { name: "tuz" }],
    );
    expect(result.inSync).toBe(false);
    expect(result.extraInferred).toContain("GLUTEN");
    expect(result.extraInferred).toContain("YUMURTA");
    expect(result.extraDeclared).toEqual([]);
  });

  it("flags extraDeclared when tag exists but matcher cannot find ingredient", () => {
    const result = computeAllergenConfidence(
      ["SUSAM"],
      [{ name: "un" }, { name: "domates" }],
    );
    expect(result.extraDeclared).toContain("SUSAM");
    expect(result.inSync).toBe(false);
  });

  it("empty ingredients + empty declared = inSync", () => {
    const result = computeAllergenConfidence([], []);
    expect(result.inSync).toBe(true);
    expect(result.extraInferred).toEqual([]);
    expect(result.extraDeclared).toEqual([]);
  });

  it("partial declared set: SUT declared but YUMURTA inferred extra", () => {
    const result = computeAllergenConfidence(
      ["SUT"],
      [{ name: "süt" }, { name: "yumurta" }, { name: "tuz" }],
    );
    expect(result.inSync).toBe(false);
    expect(result.extraInferred).toEqual(["YUMURTA"]);
    expect(result.extraDeclared).toEqual([]);
  });
});
