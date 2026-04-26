import { describe, expect, it } from "vitest";
import { findGuide, type IngredientGuide } from "@/lib/recipe/ingredient-guide";

const SAMPLE: Record<string, IngredientGuide> = {
  "tereyağı": {
    name: "Tereyağı",
    whyUsed: "Yemek, çorba ve tatlılarda parlaklık verir.",
    substitutes: ["margarin", "sade yağ"],
    notes: null,
  },
  "soğan": {
    name: "Soğan",
    whyUsed: "Sote ve çorba tabanı için aroma.",
    substitutes: ["arpacık soğan", "frenk soğanı"],
    notes: "Tatlandırmak için daha uzun pişirin.",
  },
  "tahin": {
    name: "Tahin",
    whyUsed: "Humus ve helva temeli.",
    substitutes: ["fındık ezmesi", "yer fıstığı ezmesi"],
    notes: null,
  },
};

describe("findGuide", () => {
  it("exact match (lowercase)", () => {
    expect(findGuide("Tereyağı", SAMPLE)?.name).toBe("Tereyağı");
    expect(findGuide("tereyağı", SAMPLE)?.name).toBe("Tereyağı");
  });

  it("trim whitespace", () => {
    expect(findGuide("  Soğan  ", SAMPLE)?.name).toBe("Soğan");
  });

  it("last-word match (compound name)", () => {
    expect(findGuide("Sade tereyağı", SAMPLE)?.name).toBe("Tereyağı");
    expect(findGuide("Kuru soğan", SAMPLE)?.name).toBe("Soğan");
  });

  it("any-word match (multi-word)", () => {
    expect(findGuide("Soğan suyu", SAMPLE)?.name).toBe("Soğan");
  });

  it("substring fallback", () => {
    expect(findGuide("Tahinli karışım", SAMPLE)?.name).toBe("Tahin");
  });

  it("returns null when no match", () => {
    expect(findGuide("Çikolata", SAMPLE)).toBeNull();
    expect(findGuide("Buz", SAMPLE)).toBeNull();
  });

  it("very short word (< 3 chars) skipped in word-by-word lookup", () => {
    const guides = { "su": SAMPLE.tahin };
    expect(findGuide("Soğuk su tabanı", guides)).toBeNull();
  });
});
