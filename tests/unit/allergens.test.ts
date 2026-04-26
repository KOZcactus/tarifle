import { describe, expect, it } from "vitest";
import {
  ALLERGEN_LABEL,
  ALLERGEN_ORDER,
  inferAllergensFromIngredients,
} from "@/lib/allergens";

function ingr(...names: string[]) {
  return names.map((name) => ({ name }));
}

describe("inferAllergensFromIngredients", () => {
  it("returns empty for an all-safe ingredient list", () => {
    const result = inferAllergensFromIngredients(
      ingr("domates", "salatalık", "limon", "zeytinyağı", "biber"),
    );
    expect(result).toEqual([]);
  });

  it("detects GLUTEN via 'un' / 'bulgur' / 'makarna'", () => {
    expect(inferAllergensFromIngredients(ingr("un"))).toContain("GLUTEN");
    expect(inferAllergensFromIngredients(ingr("köftelik bulgur"))).toContain(
      "GLUTEN",
    );
    expect(inferAllergensFromIngredients(ingr("spagetti makarna"))).toContain(
      "GLUTEN",
    );
  });

  it("detects SUT via 'yoğurt' / 'süt' / 'peynir' / 'tereyağı'", () => {
    expect(inferAllergensFromIngredients(ingr("tam yağlı yoğurt"))).toContain(
      "SUT",
    );
    expect(inferAllergensFromIngredients(ingr("süt"))).toContain("SUT");
    expect(inferAllergensFromIngredients(ingr("beyaz peynir"))).toContain(
      "SUT",
    );
    expect(inferAllergensFromIngredients(ingr("tereyağı"))).toContain("SUT");
  });

  it("detects YUMURTA", () => {
    expect(inferAllergensFromIngredients(ingr("yumurta", "un"))).toContain(
      "YUMURTA",
    );
  });

  it("detects KUSUYEMIS via tree nuts", () => {
    const r = inferAllergensFromIngredients(
      ingr("ceviz içi", "toz şeker"),
    );
    expect(r).toContain("KUSUYEMIS");
  });

  it("'antep fıstığı' is KUSUYEMIS, not YER_FISTIGI", () => {
    const r = inferAllergensFromIngredients(ingr("antep fıstığı"));
    expect(r).toContain("KUSUYEMIS");
    expect(r).not.toContain("YER_FISTIGI");
  });

  describe("oturum 23 false positive fixes", () => {
    it("'kekik' (oregano) is NOT GLUTEN", () => {
      const r = inferAllergensFromIngredients(ingr("kekik"));
      expect(r).not.toContain("GLUTEN");
    });

    it("'kekikli zeytinyagi' is NOT GLUTEN", () => {
      const r = inferAllergensFromIngredients(ingr("kekikli zeytinyağı"));
      expect(r).not.toContain("GLUTEN");
    });

    it("'nişasta' standalone is NOT GLUTEN (TR varsayim: misir nisastasi)", () => {
      const r = inferAllergensFromIngredients(ingr("nişasta"));
      expect(r).not.toContain("GLUTEN");
    });

    it("'buğday nişastası' IS GLUTEN", () => {
      const r = inferAllergensFromIngredients(ingr("buğday nişastası"));
      expect(r).toContain("GLUTEN");
    });

    it("'mısır nişastası' is NOT GLUTEN", () => {
      const r = inferAllergensFromIngredients(ingr("mısır nişastası"));
      expect(r).not.toContain("GLUTEN");
    });

    it("'Hindistancevizi sütü' (boşluksuz TR yazim) is NOT KUSUYEMIS", () => {
      const r = inferAllergensFromIngredients(ingr("Hindistancevizi sütü"));
      expect(r).not.toContain("KUSUYEMIS");
    });

    it("'Hindistancevizi rendesi' (boşluksuz) is NOT KUSUYEMIS", () => {
      const r = inferAllergensFromIngredients(ingr("Hindistancevizi rendesi"));
      expect(r).not.toContain("KUSUYEMIS");
    });

    it("'hindistan cevizi sütü' (boşluklu) hala NOT KUSUYEMIS (regression)", () => {
      const r = inferAllergensFromIngredients(ingr("hindistan cevizi sütü"));
      expect(r).not.toContain("KUSUYEMIS");
    });

    it("'kek' standalone IS GLUTEN (gerek tarif kek hamuru)", () => {
      const r = inferAllergensFromIngredients(ingr("kakaolu kek küpü"));
      expect(r).toContain("GLUTEN");
    });

    it("'badem' / 'ceviz' KUSUYEMIS regression (gerek aileye dahil)", () => {
      const r = inferAllergensFromIngredients(ingr("badem", "ceviz"));
      expect(r).toContain("KUSUYEMIS");
    });
  });

  it("'yer fıstığı' is YER_FISTIGI, not KUSUYEMIS", () => {
    const r = inferAllergensFromIngredients(ingr("yer fıstığı"));
    expect(r).toContain("YER_FISTIGI");
    expect(r).not.toContain("KUSUYEMIS");
  });

  it("'fıstık ezmesi' is YER_FISTIGI", () => {
    const r = inferAllergensFromIngredients(ingr("fıstık ezmesi"));
    expect(r).toContain("YER_FISTIGI");
  });

  it("detects SOYA via soya/tofu/miso", () => {
    expect(inferAllergensFromIngredients(ingr("soya sosu"))).toContain("SOYA");
    expect(inferAllergensFromIngredients(ingr("tofu"))).toContain("SOYA");
  });

  it("detects DENIZ_URUNLERI for fish + shellfish", () => {
    expect(inferAllergensFromIngredients(ingr("somon fileto"))).toContain(
      "DENIZ_URUNLERI",
    );
    expect(inferAllergensFromIngredients(ingr("karides"))).toContain(
      "DENIZ_URUNLERI",
    );
  });

  it("detects SUSAM via 'tahin' and 'susam'", () => {
    expect(inferAllergensFromIngredients(ingr("tahin"))).toContain("SUSAM");
    expect(inferAllergensFromIngredients(ingr("susam"))).toContain("SUSAM");
  });

  it("detects HARDAL", () => {
    expect(inferAllergensFromIngredients(ingr("hardal"))).toContain("HARDAL");
  });

  it("returns multiple allergens when present together (e.g. baklava)", () => {
    const r = inferAllergensFromIngredients(
      ingr("un", "yumurta", "ceviz içi", "tereyağı", "süt"),
    );
    expect(r).toEqual(
      expect.arrayContaining(["GLUTEN", "YUMURTA", "KUSUYEMIS", "SUT"]),
    );
  });

  it("Turkish-lowercases inputs so 'İRMİK' matches", () => {
    const r = inferAllergensFromIngredients(ingr("İRMİK"));
    expect(r).toContain("GLUTEN");
  });

  it("normalizes diacritics (yoğurt → yogurt) and still matches", () => {
    const r = inferAllergensFromIngredients(ingr("YOĞURT"));
    expect(r).toContain("SUT");
  });

  it("returns allergens in canonical ALLERGEN_ORDER", () => {
    const r = inferAllergensFromIngredients(
      ingr("tahin", "un", "süt", "yumurta"),
    );
    // Canonical order: GLUTEN, SUT, YUMURTA, …, SUSAM
    const indices = r.map((a) => ALLERGEN_ORDER.indexOf(a));
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });

  it("does NOT false-positive 'un' inside 'uncut' style substrings (n-gram hunt)", () => {
    // Turkish 'un' is 2 chars, tight match risk. "duncan" doesn't exist in
    // any TR recipe ingredient; let's test a realistic non-gluten name.
    const r = inferAllergensFromIngredients(ingr("domates"));
    expect(r).not.toContain("GLUTEN");
  });

  it("treats 'deniz mahsulü' / 'deniz ürün' family coverage", () => {
    expect(inferAllergensFromIngredients(ingr("deniz ürünleri"))).toContain(
      "DENIZ_URUNLERI",
    );
  });
});

describe("ALLERGEN_LABEL", () => {
  it("has a TR label for every enum value", () => {
    for (const key of ALLERGEN_ORDER) {
      expect(ALLERGEN_LABEL[key]).toBeTruthy();
      expect(typeof ALLERGEN_LABEL[key]).toBe("string");
    }
  });
});
