import { describe, it, expect } from "vitest";
import {
  asciiNormalize,
  levenshteinDistance,
  fuzzyMatches,
  tokensFuzzyMatch,
} from "@/lib/fuzzy";

describe("asciiNormalize", () => {
  it("lowercases Turkish characters to Latin", () => {
    expect(asciiNormalize("Şeker")).toBe("seker");
    expect(asciiNormalize("GÜL")).toBe("gul");
    expect(asciiNormalize("Çilek")).toBe("cilek");
    expect(asciiNormalize("MAYDANOZ")).toBe("maydanoz");
  });

  it("handles ı/i pair correctly", () => {
    expect(asciiNormalize("KIRMIZI")).toBe("kirmizi");
    expect(asciiNormalize("İZMİR")).toBe("izmir");
  });

  it("leaves already-ASCII input unchanged modulo case", () => {
    expect(asciiNormalize("domates")).toBe("domates");
    expect(asciiNormalize("HELLO")).toBe("hello");
  });

  it("handles accented vowels (â, î, û)", () => {
    expect(asciiNormalize("kâğıt")).toBe("kagit");
  });
});

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("domates", "domates")).toBe(0);
  });

  it("returns string length when one is empty", () => {
    expect(levenshteinDistance("", "domates")).toBe(7);
    expect(levenshteinDistance("kekik", "")).toBe(5);
  });

  it("counts a single substitution", () => {
    expect(levenshteinDistance("domates", "domatez")).toBe(1);
    expect(levenshteinDistance("kerik", "kekik")).toBe(1);
  });

  it("counts insertion / deletion", () => {
    expect(levenshteinDistance("domate", "domates")).toBe(1);
    expect(levenshteinDistance("dommates", "domates")).toBe(1);
  });

  it("combines multiple edits", () => {
    expect(levenshteinDistance("kekik", "kemik")).toBe(1); // k→m
    expect(levenshteinDistance("kitten", "sitting")).toBe(3); // classic
  });
});

describe("fuzzyMatches — length-based threshold", () => {
  it("rejects short-word near misses (≤4 char)", () => {
    // "et" vs "at" tek harf fark ama kelimeler farklı — tolere etmeyiz
    expect(fuzzyMatches("et", "at")).toBe(false);
    expect(fuzzyMatches("su", "sup")).toBe(false);
  });

  it("accepts 1-edit at 5-7 char length", () => {
    expect(fuzzyMatches("domates", "domatez")).toBe(true);
    expect(fuzzyMatches("kekik", "kerik")).toBe(true);
    expect(fuzzyMatches("mercimek", "mersimek")).toBe(true); // 8 char, L=1
  });

  it("rejects 2-edit at 5-7 char length", () => {
    // "domates" (7) → "domatsz" (7), 2 substitution, max len 7 → threshold 1
    expect(fuzzyMatches("domates", "domatsz")).toBe(false);
  });

  it("accepts 2-edit at 8+ char length", () => {
    expect(fuzzyMatches("profiterol", "profiteroll")).toBe(true); // 1 insert
    expect(fuzzyMatches("spagetti", "spagetttti")).toBe(true); // 2 insert
  });

  it("accepts identical strings", () => {
    expect(fuzzyMatches("domates", "domates")).toBe(true);
  });

  it("normalizes Turkish → Latin before comparing", () => {
    expect(fuzzyMatches("şeker", "seker")).toBe(true);
    expect(fuzzyMatches("çilek", "cilek")).toBe(true);
    expect(fuzzyMatches("maydanoz", "maydonoz")).toBe(true); // L=1 üstelik
  });

  it("honors explicit maxDistance override", () => {
    // Normal rule "et"/"at" = rej, ama maxDistance:1 verilince kabul
    expect(fuzzyMatches("et", "at", { maxDistance: 1 })).toBe(true);
  });

  it("rejects when length diff exceeds threshold (short-circuit)", () => {
    expect(fuzzyMatches("domates", "domateslerimiz")).toBe(false);
  });
});

describe("tokensFuzzyMatch", () => {
  it("matches every user token against any recipe token (fuzzy)", () => {
    expect(
      tokensFuzzyMatch(
        ["dana", "eti"],
        ["dana", "etı"], // user "etı" typo
      ),
    ).toBe(true);
  });

  it("returns false when a user token has no near recipe match", () => {
    expect(
      tokensFuzzyMatch(["domates", "soğan"], ["zeytin"]),
    ).toBe(false);
  });

  it("handles empty inputs", () => {
    expect(tokensFuzzyMatch([], ["domates"])).toBe(false);
    expect(tokensFuzzyMatch(["domates"], [])).toBe(false);
  });
});
