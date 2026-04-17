import { describe, expect, it } from "vitest";
import {
  computeMatch,
  ingredientMatches,
  isPantryStaple,
  normalizeIngredient,
  recipeContainsExcluded,
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

  // Regression — prefix-matching bug: "sucuk" used to be treated as staple
  // "su" because the old bidirectional prefix check said "sucuk".startsWith("su").
  // Sucuklu Yumurta then scored %100 match without sucuk in the user's list.
  it("does NOT treat ingredients that merely start with a staple prefix as staples", () => {
    expect(isPantryStaple("sucuk")).toBe(false);
    expect(isPantryStaple("Sucuk")).toBe(false);
    expect(isPantryStaple("yağmur")).toBe(false); // starts with "yağ"
    expect(isPantryStaple("sumak")).toBe(false); // starts with "su"
    expect(isPantryStaple("tuzlu kraker")).toBe(false); // "tuzlu" ≠ "tuz"
  });

  it("recognises multi-word seasoning groups like 'tuz, karabiber'", () => {
    expect(isPantryStaple("tuz, karabiber")).toBe(true);
    expect(isPantryStaple("Tuz, karabiber")).toBe(true);
  });

  it("rejects mixed seasoning where one token is NOT a staple", () => {
    // safran isn't in PANTRY_STAPLES; the whole phrase must be pantry-only.
    expect(isPantryStaple("tuz, karabiber, safran")).toBe(false);
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

describe("synonym matching", () => {
  it("piliç matches tavuk göğsü via synonym", () => {
    expect(ingredientMatches("Tavuk göğsü", "piliç")).toBe(true);
  });

  it("spagetti matches makarna via synonym", () => {
    expect(ingredientMatches("Makarna", "spagetti")).toBe(true);
  });

  it("non-synonym does not match", () => {
    expect(ingredientMatches("Tavuk göğsü", "balık")).toBe(false);
  });

  // ─── v2 expansion (17 Nis) regression suite ──────────────

  it("kıyma DOES NOT match dana eti (ayrı gruplarda, false-positive fix)", () => {
    // Önceden "et, dana eti, kıyma, dana kıyma" tek grupta — "kıyma" kullanıcısı
    // parça eti olan tarife de yönlendiriliyordu. v2'de "kıyma" kendi grubu.
    expect(ingredientMatches("Dana eti", "kıyma")).toBe(false);
  });

  it("dana kıyma matches kıyma", () => {
    expect(ingredientMatches("Dana kıyma", "kıyma")).toBe(true);
  });

  it("tavuk kıyma does not match dana kıyma (ayrı protein)", () => {
    expect(ingredientMatches("Dana kıyma", "tavuk kıyma")).toBe(false);
  });

  it("somon matches balık via synonym", () => {
    expect(ingredientMatches("Somon", "balık")).toBe(true);
  });

  it("balık matches hamsi via synonym", () => {
    expect(ingredientMatches("Hamsi", "balık")).toBe(true);
  });

  it("balık does NOT match karides (ayrı grup)", () => {
    expect(ingredientMatches("Karides", "balık")).toBe(false);
  });

  it("süzme yoğurt matches yoğurt", () => {
    expect(ingredientMatches("Süzme yoğurt", "yoğurt")).toBe(true);
  });

  it("tereyağı matches sade yağ", () => {
    expect(ingredientMatches("Sade yağ", "tereyağı")).toBe(true);
  });

  it("sızma zeytinyağı matches zeytinyağı", () => {
    expect(ingredientMatches("Sızma zeytinyağı", "zeytinyağı")).toBe(true);
  });

  it("ayçiçek yağı matches mısır özü yağı (bitkisel yağ ikamesi)", () => {
    expect(ingredientMatches("Mısır özü yağı", "ayçiçek yağı")).toBe(true);
  });

  it("çeri domates matches salkım domates", () => {
    expect(ingredientMatches("Çeri domates", "salkım domates")).toBe(true);
  });

  it("kapya biber matches biber", () => {
    expect(ingredientMatches("Kapya biber", "biber")).toBe(true);
  });

  it("yeşil soğan matches taze soğan", () => {
    expect(ingredientMatches("Yeşil soğan", "taze soğan")).toBe(true);
  });

  it("fesleğen matches reyhan", () => {
    expect(ingredientMatches("Fesleğen", "reyhan")).toBe(true);
  });

  it("kırmızı mercimek matches mercimek", () => {
    expect(ingredientMatches("Kırmızı mercimek", "mercimek")).toBe(true);
  });

  it("köftelik bulgur matches bulgur", () => {
    expect(ingredientMatches("Köftelik bulgur", "bulgur")).toBe(true);
  });

  it("nohut matches haşlanmış nohut", () => {
    expect(ingredientMatches("Haşlanmış nohut", "nohut")).toBe(true);
  });

  it("beyaz fasulye DOES NOT match barbunya", () => {
    // Barbunya ayrı bir grupta olmadığı için geçmemeli
    expect(ingredientMatches("Barbunya", "beyaz fasulye")).toBe(false);
  });

  it("buğday unu matches un", () => {
    expect(ingredientMatches("Buğday unu", "un")).toBe(true);
  });

  it("mısır nişastası matches nişasta", () => {
    expect(ingredientMatches("Mısır nişastası", "nişasta")).toBe(true);
  });

  it("nişasta does NOT match un (ayrı gruplar)", () => {
    expect(ingredientMatches("Un", "nişasta")).toBe(false);
  });

  it("esmer şeker matches şeker", () => {
    expect(ingredientMatches("Esmer şeker", "şeker")).toBe(true);
  });

  it("limon suyu matches limon", () => {
    expect(ingredientMatches("Limon suyu", "limon")).toBe(true);
  });

  it("elma sirkesi matches sirke", () => {
    expect(ingredientMatches("Elma sirkesi", "sirke")).toBe(true);
  });

  it("balzamik sirke matches beyaz sirke", () => {
    expect(ingredientMatches("Balzamik sirke", "beyaz sirke")).toBe(true);
  });

  it("domates salçası matches biber salçası (salça grubu)", () => {
    // Tarif biber salçası istiyor, user domates salçası yazıyor — ikame.
    expect(ingredientMatches("Biber salçası", "domates salçası")).toBe(true);
  });

  it("kuru maya matches maya", () => {
    expect(ingredientMatches("Kuru maya", "maya")).toBe(true);
  });

  it("istiridye mantarı matches mantar", () => {
    expect(ingredientMatches("İstiridye mantarı", "mantar")).toBe(true);
  });

  it("kara lahana matches lahana", () => {
    expect(ingredientMatches("Kara lahana", "lahana")).toBe(true);
  });

  it("dondurulmuş ıspanak matches ıspanak", () => {
    expect(ingredientMatches("Dondurulmuş ıspanak", "ıspanak")).toBe(true);
  });

  it("kaşar peyniri matches beyaz peynir via peynir grubu", () => {
    expect(ingredientMatches("Kaşar peyniri", "beyaz peynir")).toBe(true);
  });
});

describe("pantry staples v2 (17 Nis) additions", () => {
  it("tereyağı is pantry staple", () => {
    expect(isPantryStaple("Tereyağı")).toBe(true);
  });

  it("maydanoz is pantry staple", () => {
    expect(isPantryStaple("Maydanoz")).toBe(true);
  });

  it("maya is pantry staple", () => {
    expect(isPantryStaple("Maya")).toBe(true);
  });

  it("sirke is pantry staple", () => {
    expect(isPantryStaple("Sirke")).toBe(true);
  });

  it("limon suyu is pantry staple", () => {
    expect(isPantryStaple("Limon suyu")).toBe(true);
  });

  it("yumurta is NOT pantry (kullanıcı gerçekten eksikse bildirim almalı)", () => {
    expect(isPantryStaple("Yumurta")).toBe(false);
  });

  it("soğan is NOT pantry (temel malzeme sayılır, eksikse bilmeli)", () => {
    expect(isPantryStaple("Soğan")).toBe(false);
  });
});

describe("recipeContainsExcluded", () => {
  const ings = [
    { name: "Tavuk göğsü" },
    { name: "Soğan" },
    { name: "Fıstık" },
    { name: "Zeytinyağı" },
  ];

  it("returns true when an excluded ingredient matches", () => {
    expect(recipeContainsExcluded(ings, ["fıstık"])).toBe(true);
  });

  it("returns false when no excluded ingredient matches", () => {
    expect(recipeContainsExcluded(ings, ["yumurta"])).toBe(false);
  });

  it("handles empty exclude list", () => {
    expect(recipeContainsExcluded(ings, [])).toBe(false);
  });

  it("matches with prefix logic (tavuk matches Tavuk göğsü)", () => {
    expect(recipeContainsExcluded(ings, ["tavuk"])).toBe(true);
  });

  it("does not match partial non-prefix (ğan does not match Soğan)", () => {
    expect(recipeContainsExcluded(ings, ["ğan"])).toBe(false);
  });
});
