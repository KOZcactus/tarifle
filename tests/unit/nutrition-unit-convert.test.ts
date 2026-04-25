/**
 * Amount -> gram converter unit testleri (oturum 20, Faz 2).
 *
 * Kapsam:
 *   - parseQuantity: sayi, fraction, range, word number
 *   - convertToGrams: weight, volume, count, orta boy, tutam, fallback
 */

import { describe, it, expect } from "vitest";
import { parseQuantity, convertToGrams } from "@/lib/nutrition/unit-convert";

describe("parseQuantity", () => {
  it("parses integer", () => {
    expect(parseQuantity("500 gr")).toBe(500);
  });
  it("parses decimal", () => {
    expect(parseQuantity("1.5 kg")).toBe(1.5);
  });
  it("parses comma decimal (TR)", () => {
    expect(parseQuantity("0,75 lt")).toBe(0.75);
  });
  it("parses fraction", () => {
    expect(parseQuantity("1/2 su bardagi")).toBe(0.5);
  });
  it("parses range as average", () => {
    expect(parseQuantity("2-3 dis sarimsak")).toBe(2.5);
  });
  it("parses word number 'yarim'", () => {
    expect(parseQuantity("yarim cay kasigi")).toBe(0.5);
  });
  it("parses word number 'iki'", () => {
    expect(parseQuantity("iki yemek kasigi")).toBe(2);
  });
  it("returns null for empty", () => {
    expect(parseQuantity("")).toBeNull();
  });
});

describe("convertToGrams", () => {
  describe("weight units", () => {
    it("'500 gr' -> 500", () => {
      expect(convertToGrams("500 gr")).toBe(500);
    });
    it("'1 kg' -> 1000", () => {
      expect(convertToGrams("1 kg")).toBe(1000);
    });
    it("'250 g' -> 250", () => {
      expect(convertToGrams("250 g")).toBe(250);
    });
    it("'2.5 kilo' -> 2500", () => {
      expect(convertToGrams("2.5 kilo")).toBe(2500);
    });
  });

  describe("volume units (default density 1.0)", () => {
    it("'1 su bardagi' su -> 200g", () => {
      expect(convertToGrams("1 su bardagi", { ingredientName: "su" })).toBe(200);
    });
    it("'2 yemek kasigi' default -> 30g (volume * density 1.0)", () => {
      expect(convertToGrams("2 yemek kasigi")).toBe(30);
    });
    it("'1 cay kasigi' tuz -> 5*1.2 = 6g (tuz density 1.2)", () => {
      expect(convertToGrams("1 cay kasigi", { ingredientName: "tuz" })).toBe(6);
    });
    it("'2 su bardagi' un -> 2*200*0.6 = 240g (un density 0.6)", () => {
      expect(convertToGrams("2 su bardagi", { ingredientName: "un" })).toBe(240);
    });
    it("'500 ml' default -> 500g", () => {
      expect(convertToGrams("500 ml")).toBe(500);
    });
  });

  describe("count units (gramsPerUnit context)", () => {
    it("'1 adet yumurta' (gramsPerUnit=50) -> 50g", () => {
      expect(
        convertToGrams("1 adet", { ingredientName: "yumurta", gramsPerUnit: 50, defaultUnit: "adet" }),
      ).toBe(50);
    });
    it("'2 dis sarimsak' (gramsPerUnit=3) -> 6g", () => {
      expect(
        convertToGrams("2 dis", { ingredientName: "sarimsak", gramsPerUnit: 3, defaultUnit: "diş" }),
      ).toBe(6);
    });
    it("'3 tane' generic (gramsPerUnit=110) -> 330g", () => {
      expect(
        convertToGrams("3 tane", { ingredientName: "sogan", gramsPerUnit: 110 }),
      ).toBe(330);
    });
  });

  describe("orta boy / size lookup", () => {
    it("'orta boy domates' -> 150g", () => {
      expect(convertToGrams("orta boy", { ingredientName: "domates" })).toBe(150);
    });
    it("'2 orta boy patates' -> 346g", () => {
      expect(convertToGrams("2 orta boy", { ingredientName: "patates" })).toBe(346);
    });
    it("'1 büyük domates' -> 195g (1.3x)", () => {
      expect(convertToGrams("1 büyük", { ingredientName: "domates" })).toBe(195);
    });
    it("'2 küçük havuc' -> 84g (0.7x)", () => {
      expect(convertToGrams("2 küçük", { ingredientName: "havuc" })).toBe(84);
    });
  });

  describe("tiny amounts", () => {
    it("'tutam' -> 1.5g", () => {
      expect(convertToGrams("tutam")).toBe(1.5);
    });
    it("'1 tutam' -> 1.5g", () => {
      expect(convertToGrams("1 tutam")).toBe(1.5);
    });
    it("'2 fiske' -> 1g", () => {
      expect(convertToGrams("2 fiske")).toBe(1);
    });
  });

  describe("fallback", () => {
    it("returns null for unparseable text", () => {
      expect(convertToGrams("biraz")).toBeNull();
    });
    it("returns null for empty", () => {
      expect(convertToGrams("")).toBeNull();
    });
    it("returns null for context-less '1 adet'", () => {
      expect(convertToGrams("1 adet")).toBeNull();
    });
  });
});
