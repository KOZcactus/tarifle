import { describe, expect, it } from "vitest";
import { inferDietTags } from "@/lib/diet-inference";
import type { Allergen } from "@prisma/client";

function ingr(...names: string[]) {
  return names.map((name) => ({ name }));
}

const noAllergens: Allergen[] = [];

describe("inferDietTags, vegetarian", () => {
  it("is vegetarian + vegan for an all-plant recipe", () => {
    const r = inferDietTags(
      ingr("domates", "salatalık", "limon", "nane", "zeytinyağı"),
      noAllergens,
    );
    expect(r.vegetarian).toBe(true);
    expect(r.vegan).toBe(true);
  });

  it("is NOT vegetarian when meat keyword present (kıyma)", () => {
    const r = inferDietTags(
      ingr("kıyma", "soğan", "domates"),
      noAllergens,
    );
    expect(r.vegetarian).toBe(false);
    expect(r.vegan).toBe(false);
  });

  it("is NOT vegetarian for chicken (tavuk/piliç)", () => {
    expect(
      inferDietTags(ingr("tavuk göğsü"), noAllergens).vegetarian,
    ).toBe(false);
    expect(
      inferDietTags(ingr("piliç budu"), noAllergens).vegetarian,
    ).toBe(false);
  });

  it("is NOT vegetarian for red meat cuts (bonfile/kuzu/dana)", () => {
    expect(inferDietTags(ingr("dana bonfile"), noAllergens).vegetarian).toBe(
      false,
    );
    expect(inferDietTags(ingr("kuzu eti"), noAllergens).vegetarian).toBe(false);
  });

  it("is NOT vegetarian when seafood allergen is set", () => {
    const r = inferDietTags(ingr("deniz ürünü karışımı"), ["DENIZ_URUNLERI"]);
    expect(r.vegetarian).toBe(false);
  });
});

describe("inferDietTags, vegan", () => {
  it("vegetarian but NOT vegan when dairy (SUT) allergen present", () => {
    const r = inferDietTags(ingr("yoğurt", "nane"), ["SUT"]);
    expect(r.vegetarian).toBe(true);
    expect(r.vegan).toBe(false);
  });

  it("vegetarian but NOT vegan when eggs (YUMURTA) allergen present", () => {
    const r = inferDietTags(ingr("yumurta", "un"), ["YUMURTA"]);
    expect(r.vegetarian).toBe(true);
    expect(r.vegan).toBe(false);
  });

  it("vegetarian but NOT vegan when honey is in the ingredients", () => {
    const r = inferDietTags(ingr("ceviz içi", "bal", "tarçın"), noAllergens);
    expect(r.vegetarian).toBe(true);
    expect(r.vegan).toBe(false);
  });

  it("does NOT false-positive on 'balkabağı' (pumpkin) as honey", () => {
    const r = inferDietTags(
      ingr("balkabağı", "süt olmayan süt", "zencefil"),
      noAllergens,
    );
    expect(r.vegetarian).toBe(true);
    expect(r.vegan).toBe(true);
  });

  it("does NOT false-positive on 'bal kabağı' (with space, pumpkin)", () => {
    const r = inferDietTags(
      ingr("bal kabağı", "zencefil", "tarçın"),
      noAllergens,
    );
    expect(r.vegan).toBe(true);
  });

  it("does flag 'ballı' (honey-glazed) as non-vegan", () => {
    const r = inferDietTags(ingr("ballı ceviz", "yulaf"), noAllergens);
    expect(r.vegan).toBe(false);
    expect(r.vegetarian).toBe(true);
  });

  it("flags gelatin (jelatin) as non-vegan", () => {
    const r = inferDietTags(ingr("jelatin", "meyve suyu"), noAllergens);
    expect(r.vegan).toBe(false);
  });
});

describe("inferDietTags, edge cases", () => {
  it("non-vegetarian is never vegan", () => {
    const r = inferDietTags(ingr("dana kıyma"), ["SUT", "YUMURTA"]);
    expect(r.vegetarian).toBe(false);
    expect(r.vegan).toBe(false);
  });

  it("empty ingredient list is vacuously vegan", () => {
    const r = inferDietTags([], noAllergens);
    expect(r.vegetarian).toBe(true);
    expect(r.vegan).toBe(true);
  });

  it("Turkish case insensitivity works (KIYMA should flag)", () => {
    expect(inferDietTags(ingr("KIYMA"), noAllergens).vegetarian).toBe(false);
  });
});
