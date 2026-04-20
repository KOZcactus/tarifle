/**
 * Unit tests for the similar-recipes scoring algorithm. The DB-touching
 * path (`getSimilarRecipes`) needs a live Postgres; the pure scorer
 * (`scoreCandidates`) captures the actual signal matrix and merits
 * coverage.
 */
import { describe, it, expect } from "vitest";
import {
  filterSignalIngredients,
  normalizeIngredientName,
  scoreCandidates,
  type SimilarTarget,
} from "../../src/lib/queries/similar-recipes";

function c(overrides: {
  id: string;
  title?: string;
  categoryId?: string;
  type?: string;
  difficulty?: string;
  cuisine?: string | null;
  createdAt?: Date;
  tagSlugs?: string[];
  ingredientNames?: string[];
  isFeatured?: boolean;
  hungerBar?: number | null;
}) {
  return {
    id: overrides.id,
    title: overrides.title ?? `Recipe ${overrides.id}`,
    categoryId: overrides.categoryId ?? "cat-different",
    type: overrides.type ?? "TATLI",
    difficulty: overrides.difficulty ?? "EASY",
    cuisine: overrides.cuisine ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-01-01"),
    tagSlugs: overrides.tagSlugs ?? [],
    ingredientNames: overrides.ingredientNames,
    isFeatured: overrides.isFeatured,
    hungerBar: overrides.hungerBar,
  };
}

const target: SimilarTarget = {
  id: "target",
  categoryId: "cat-yemek",
  type: "YEMEK",
  difficulty: "MEDIUM",
  cuisine: "tr",
  tagSlugs: ["misafir-sofrasi", "yuksek-protein", "firinda"],
  ingredientNames: [],
};

describe("scoreCandidates, ağırlıklar", () => {
  it("aynı kategori +3 puan", () => {
    const r = scoreCandidates(target, [
      c({ id: "same-cat", categoryId: "cat-yemek", type: "ICECEK" }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]?.score).toBe(3);
  });

  it("aynı type +2 puan", () => {
    const r = scoreCandidates(target, [
      c({ id: "same-type", categoryId: "cat-xxx", type: "YEMEK" }),
    ]);
    expect(r[0]?.score).toBe(2);
  });

  it("aynı difficulty +0.5", () => {
    const r = scoreCandidates(target, [
      c({ id: "same-diff", categoryId: "cat-xxx", type: "TATLI", difficulty: "MEDIUM", tagSlugs: ["firinda"] }),
    ]);
    // +0.5 (difficulty) + 1 (shared tag "firinda") = 1.5
    expect(r[0]?.score).toBe(1.5);
  });

  it("aynı cuisine +1.5", () => {
    const r = scoreCandidates(target, [
      c({ id: "same-cuisine", categoryId: "cat-xxx", type: "TATLI", cuisine: "tr", tagSlugs: [] }),
    ]);
    // +1.5 (cuisine)
    expect(r[0]?.score).toBe(1.5);
  });

  it("farklı cuisine bonus yok", () => {
    const r = scoreCandidates(target, [
      c({ id: "diff-cuisine", categoryId: "cat-xxx", type: "TATLI", cuisine: "jp", tagSlugs: ["firinda"] }),
    ]);
    // +1 (shared tag) only, no cuisine bonus
    expect(r[0]?.score).toBe(1);
  });

  it("her ortak tag +1 (max 3 shared = +3)", () => {
    const r = scoreCandidates(target, [
      c({
        id: "all-tags",
        categoryId: "cat-xxx",
        type: "ICECEK",
        tagSlugs: ["misafir-sofrasi", "yuksek-protein", "firinda"],
      }),
    ]);
    expect(r[0]?.score).toBe(3);
  });

  it("yalnızca farklı tag'lar ortak değildir → 0 skor → elenir", () => {
    const r = scoreCandidates(target, [
      c({
        id: "no-signal",
        categoryId: "cat-xxx",
        type: "ICECEK",
        difficulty: "EASY",
        tagSlugs: ["vegan", "yaz-tarifi"],
      }),
    ]);
    expect(r).toHaveLength(0);
  });

  it("kombinasyon: kategori + type + 2 tag + difficulty = 3+2+2+0.5 = 7.5", () => {
    const r = scoreCandidates(target, [
      c({
        id: "max-match",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        tagSlugs: ["misafir-sofrasi", "firinda"],
      }),
    ]);
    expect(r[0]?.score).toBe(7.5);
  });
});

describe("scoreCandidates, sıralama", () => {
  it("score desc önce", () => {
    const r = scoreCandidates(target, [
      c({ id: "low", categoryId: "cat-yemek", type: "ICECEK" }), // +3
      c({ id: "high", categoryId: "cat-yemek", type: "YEMEK" }), // +5
    ]);
    expect(r.map((x) => x.id)).toEqual(["high", "low"]);
  });

  it("aynı score'da daha yeni önce", () => {
    const r = scoreCandidates(target, [
      c({
        id: "older",
        categoryId: "cat-yemek",
        createdAt: new Date("2026-01-01"),
      }),
      c({
        id: "newer",
        categoryId: "cat-yemek",
        createdAt: new Date("2026-03-01"),
      }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["newer", "older"]);
  });

  it("aynı score aynı tarih → TR alfabetik sort", () => {
    const date = new Date("2026-01-01");
    const r = scoreCandidates(target, [
      c({ id: "b", title: "Şiş Kebap", categoryId: "cat-yemek", createdAt: date }),
      c({ id: "a", title: "Adana Kebap", categoryId: "cat-yemek", createdAt: date }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });
});

describe("scoreCandidates, ingredient overlap (1501 scale enhancement)", () => {
  const ingredientTarget: SimilarTarget = {
    ...target,
    ingredientNames: ["Tavuk göğsü", "Yoğurt", "Sarımsak", "Tuz", "Karabiber"],
  };

  it("ingredient listesi verilmezse skor değişmez (backward-compat)", () => {
    const r = scoreCandidates(target, [
      c({ id: "plain", categoryId: "cat-yemek", type: "YEMEK" }),
    ]);
    expect(r[0]?.score).toBe(5); // +3 category + 2 type, no ingredient
  });

  it("1 ortak önemli malzeme → +1", () => {
    const r = scoreCandidates(ingredientTarget, [
      c({
        id: "one-ing",
        categoryId: "cat-yemek",
        type: "YEMEK",
        ingredientNames: ["Tavuk göğsü", "Soğan"],
      }),
    ]);
    // +3 category + 2 type + 1 ingredient (Tavuk göğsü) = 6
    expect(r[0]?.score).toBe(6);
  });

  it("3 ortak malzeme → cap +3 puan (4'üncü sayılmaz)", () => {
    const r = scoreCandidates(ingredientTarget, [
      c({
        id: "all-ing",
        categoryId: "cat-xxx",
        type: "TATLI",
        ingredientNames: [
          "Tavuk göğsü",
          "Yoğurt",
          "Sarımsak",
          "Limon",
        ],
      }),
    ]);
    // 3 shared non-pantry → capped at +3. No category/type match.
    expect(r[0]?.score).toBe(3);
  });

  it("pantry malzemeler sayılmaz (tuz, karabiber)", () => {
    const r = scoreCandidates(ingredientTarget, [
      c({
        id: "pantry-only",
        categoryId: "cat-xxx",
        type: "TATLI",
        ingredientNames: ["Tuz", "Karabiber", "Su"],
      }),
    ]);
    // Pantry overlap skor vermez; diğer sinyal yok → 0 → elenir
    expect(r).toHaveLength(0);
  });

  it("aynı malzeme farklı case/spacing → eşleşir (normalize)", () => {
    const r = scoreCandidates(ingredientTarget, [
      c({
        id: "cased",
        categoryId: "cat-xxx",
        type: "TATLI",
        ingredientNames: ["  TAVUK   GÖĞSÜ  ", "Biber"],
      }),
    ]);
    // "TAVUK GÖĞSÜ" normalize → "tavuk göğsü" = 1 shared ingredient
    expect(r[0]?.score).toBe(1);
  });
});

describe("scoreCandidates, isFeatured boost", () => {
  it("isFeatured candidate +0.3 boost", () => {
    const r = scoreCandidates(target, [
      c({
        id: "featured",
        categoryId: "cat-yemek",
        type: "ICECEK",
        isFeatured: true,
      }),
    ]);
    // +3 category, +0.3 featured
    expect(r[0]?.score).toBe(3.3);
  });

  it("aynı ham skorda featured olan önce gelir", () => {
    const r = scoreCandidates(target, [
      c({
        id: "plain",
        categoryId: "cat-yemek",
        type: "ICECEK",
        createdAt: new Date("2026-01-01"),
      }), // +3
      c({
        id: "featured",
        categoryId: "cat-yemek",
        type: "ICECEK",
        createdAt: new Date("2026-01-01"),
        isFeatured: true,
      }), // +3.3
    ]);
    expect(r.map((x) => x.id)).toEqual(["featured", "plain"]);
  });
});

describe("normalize + pantry helpers", () => {
  it("normalizeIngredientName: lower + trim + whitespace squash", () => {
    expect(normalizeIngredientName("  Tavuk  Göğsü ")).toBe("tavuk göğsü");
    expect(normalizeIngredientName("Zeytinyağı")).toBe("zeytinyağı");
    // Not: Prisma'daki ingredient isimleri sentence-case; ALL CAPS
    // Türkçe tariflerde pratikte görülmez. JS default toLowerCase'in
    // TR-aware olmaması burada problem yaratmaz.
  });

  it("filterSignalIngredients: pantry dışı malzemeleri tutar", () => {
    const signals = filterSignalIngredients([
      "Tavuk",
      "Tuz",
      "Karabiber",
      "Limon",
      "Su",
    ]);
    expect(signals).toEqual(["tavuk", "limon"]);
  });

  it("filterSignalIngredients: boş input → boş çıkış", () => {
    expect(filterSignalIngredients([])).toEqual([]);
  });
});

describe("scoreCandidates, kenar durumlar", () => {
  it("kendi ID'sini sonuçta göstermez", () => {
    const r = scoreCandidates(target, [
      c({ id: "target", categoryId: "cat-yemek" }),
      c({ id: "other", categoryId: "cat-yemek" }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["other"]);
  });

  it("boş aday listesi → boş sonuç", () => {
    expect(scoreCandidates(target, [])).toEqual([]);
  });

  it("hepsi signal'siz → boş sonuç (hiçbir kart gösterilmez)", () => {
    const r = scoreCandidates(target, [
      c({ id: "a", categoryId: "cat-xxx", type: "TATLI", difficulty: "HARD" }),
      c({ id: "b", categoryId: "cat-zzz", type: "ICECEK", difficulty: "EASY" }),
    ]);
    expect(r).toEqual([]);
  });
});

describe("scoreCandidates v3: cuisine region + hunger proximity", () => {
  it("aynı region farklı cuisine: +0.5 bonus (TR→GR mediterranean)", () => {
    const r = scoreCandidates(target, [
      c({
        id: "greek",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        cuisine: "gr", // same region mediterranean-levant
      }),
      c({
        id: "japanese",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        cuisine: "jp", // different region east-asia
      }),
    ]);
    // greek: category(+3) + type(+2) + difficulty(+0.5) + region(+0.5) = 6
    // japanese: category(+3) + type(+2) + difficulty(+0.5) = 5.5
    expect(r[0]!.id).toBe("greek");
    expect(r[0]!.score).toBe(6);
    expect(r[1]!.score).toBe(5.5);
  });

  it("aynı cuisine region bonus'u TRIGGER etmez (mutually exclusive)", () => {
    const r = scoreCandidates(target, [
      c({
        id: "turkish-twin",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        cuisine: "tr", // same cuisine as target
      }),
    ]);
    // cuisine(+1.5) not region(+0.5), total: 3+2+0.5+1.5 = 7
    expect(r[0]!.score).toBe(7);
  });

  it("hunger proximity: |delta|<=2 → +0.4 bonus", () => {
    const targetWithHunger: SimilarTarget = {
      ...target,
      hungerBar: 8,
    };
    const r = scoreCandidates(targetWithHunger, [
      c({
        id: "close-hunger",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        cuisine: "tr",
        hungerBar: 7, // delta 1, in range
      }),
      c({
        id: "far-hunger",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        cuisine: "tr",
        hungerBar: 3, // delta 5, out of range
      }),
    ]);
    // close-hunger: 3+2+0.5+1.5+0.4 = 7.4
    // far-hunger: 3+2+0.5+1.5 = 7.0
    expect(r[0]!.id).toBe("close-hunger");
    expect(r[0]!.score).toBe(7.4);
    expect(r[1]!.score).toBe(7);
  });

  it("hunger bar null ise proximity bonus yok", () => {
    const targetWithHunger: SimilarTarget = {
      ...target,
      hungerBar: 8,
    };
    const r = scoreCandidates(targetWithHunger, [
      c({
        id: "null-hunger",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        cuisine: "tr",
        hungerBar: null,
      }),
    ]);
    expect(r[0]!.score).toBe(7); // 3+2+0.5+1.5, hunger skipped
  });
});
