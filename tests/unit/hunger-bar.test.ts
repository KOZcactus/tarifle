import { describe, expect, it } from "vitest";
import {
  calcHungerBar,
  calcHungerBarWithBreakdown,
  hungerBarLabel,
  HUNGER_BAR_MIN,
  HUNGER_BAR_MAX,
} from "@/lib/hunger-bar";

function mk(overrides: Partial<Parameters<typeof calcHungerBar>[0]> = {}) {
  return {
    categorySlug: "et-yemekleri",
    type: "YEMEK",
    averageCalories: 350,
    protein: 20,
    carbs: 20,
    fat: 10,
    ingredientNames: [],
    ...overrides,
  };
}

describe("calcHungerBar, realistic Turkish dishes", () => {
  it("Kuru fasulye, baklagil + protein + bulk → 9-10", () => {
    const score = calcHungerBar({
      categorySlug: "baklagil-yemekleri",
      type: "YEMEK",
      averageCalories: 350,
      protein: 20,
      carbs: 45,
      fat: 8,
      ingredientNames: ["Kuru fasulye", "Soğan", "Domates salçası", "Pul biber"],
    });
    expect(score).toBeGreaterThanOrEqual(9);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("Adana Kebap, yüksek protein + yağ → 8-10", () => {
    const score = calcHungerBar({
      categorySlug: "et-yemekleri",
      type: "YEMEK",
      averageCalories: 420,
      protein: 35,
      carbs: 10,
      fat: 22,
      ingredientNames: ["Dana kıyma", "Kuyruk yağı", "Pul biber", "Tuz"],
    });
    expect(score).toBeGreaterThanOrEqual(8);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("Mercimek çorbası, baklagil bazlı orta tokluk → 5-7", () => {
    const score = calcHungerBar({
      categorySlug: "corbalar",
      type: "CORBA",
      averageCalories: 180,
      protein: 12,
      carbs: 28,
      fat: 3,
      ingredientNames: ["Kırmızı mercimek", "Soğan", "Havuç"],
    });
    expect(score).toBeGreaterThanOrEqual(5);
    expect(score).toBeLessThanOrEqual(7);
  });

  it("Ezogelin çorbası, baklagil + bulgur → 6-8", () => {
    const score = calcHungerBar({
      categorySlug: "corbalar",
      type: "CORBA",
      averageCalories: 200,
      protein: 14,
      carbs: 30,
      fat: 4,
      ingredientNames: ["Kırmızı mercimek", "Bulgur", "Nane"],
    });
    expect(score).toBeGreaterThanOrEqual(6);
    expect(score).toBeLessThanOrEqual(8);
  });

  it("Karnıyarık, sebze dolgu + kıyma → 7-9", () => {
    const score = calcHungerBar({
      categorySlug: "et-yemekleri",
      type: "YEMEK",
      averageCalories: 380,
      protein: 18,
      carbs: 20,
      fat: 12,
      ingredientNames: ["Patlıcan", "Dana kıyma", "Domates", "Soğan"],
    });
    expect(score).toBeGreaterThanOrEqual(7);
    expect(score).toBeLessThanOrEqual(9);
  });

  it("Cacık, hafif aperatif → 2-4", () => {
    const score = calcHungerBar({
      categorySlug: "aperatifler",
      type: "APERATIF",
      averageCalories: 100,
      protein: 6,
      carbs: 8,
      fat: 5,
      ingredientNames: ["Yoğurt", "Salatalık", "Sarımsak", "Nane"],
    });
    expect(score).toBeGreaterThanOrEqual(2);
    expect(score).toBeLessThanOrEqual(4);
  });

  it("Sütlaç, tatlı penalty uygulanır → 2-3", () => {
    const score = calcHungerBar({
      categorySlug: "tatlilar",
      type: "TATLI",
      averageCalories: 240,
      protein: 4,
      carbs: 38,
      fat: 5,
      ingredientNames: ["Süt", "Pirinç", "Şeker", "Vanilya"],
    });
    expect(score).toBeGreaterThanOrEqual(2);
    expect(score).toBeLessThanOrEqual(3);
  });

  it("Baklava, yoğun tatlı ama yağ yüksek → 2-3 (TATLI penalty + yağ az bonus)", () => {
    const score = calcHungerBar({
      categorySlug: "tatlilar",
      type: "TATLI",
      averageCalories: 350,
      protein: 6,
      carbs: 45,
      fat: 18,
      ingredientNames: ["Yufka", "Tereyağı", "Antep fıstığı", "Şeker"],
    });
    expect(score).toBeGreaterThanOrEqual(2);
    expect(score).toBeLessThanOrEqual(3);
  });

  it("Ayran, içecek liquid multiplier → 1-2", () => {
    const score = calcHungerBar({
      categorySlug: "icecekler",
      type: "ICECEK",
      averageCalories: 60,
      protein: 3,
      carbs: 4,
      fat: 2,
      ingredientNames: ["Yoğurt", "Su", "Tuz"],
    });
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(2);
  });

  it("Türk kahvesi, minimum tokluk → 1", () => {
    const score = calcHungerBar({
      categorySlug: "kahve-sicak-icecekler",
      type: "ICECEK",
      averageCalories: 5,
      protein: 0,
      carbs: 1,
      fat: 0,
      ingredientNames: ["Türk kahvesi", "Su", "Şeker"],
    });
    expect(score).toBe(1);
  });

  it("Mojito, alkollü kokteyl liquid multiplier → 1-2", () => {
    const score = calcHungerBar({
      categorySlug: "kokteyller",
      type: "KOKTEYL",
      averageCalories: 160,
      protein: 0,
      carbs: 16,
      fat: 0,
      ingredientNames: ["Rom", "Nane", "Limon"],
    });
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(2);
  });

  it("İskender, protein + karb + yağ ağır yemek → 8-10", () => {
    const score = calcHungerBar({
      categorySlug: "et-yemekleri",
      type: "YEMEK",
      averageCalories: 560,
      protein: 32,
      carbs: 40,
      fat: 22,
      ingredientNames: ["Dana döner", "Pide", "Yoğurt", "Tereyağı"],
    });
    expect(score).toBeGreaterThanOrEqual(8);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("Çoban salatası, hafif salata → 2-4", () => {
    const score = calcHungerBar({
      categorySlug: "salatalar",
      type: "SALATA",
      averageCalories: 120,
      protein: 3,
      carbs: 10,
      fat: 6,
      ingredientNames: ["Domates", "Salatalık", "Soğan", "Maydanoz"],
    });
    expect(score).toBeGreaterThanOrEqual(2);
    expect(score).toBeLessThanOrEqual(4);
  });

  it("Humus, baklagil ezme orta tokluk → 4-6", () => {
    const score = calcHungerBar({
      categorySlug: "aperatifler",
      type: "APERATIF",
      averageCalories: 220,
      protein: 8,
      carbs: 20,
      fat: 10,
      ingredientNames: ["Nohut", "Tahin", "Limon", "Sarımsak"],
    });
    expect(score).toBeGreaterThanOrEqual(4);
    expect(score).toBeLessThanOrEqual(6);
  });

  it("Menemen, kahvaltı tavası → 5-7", () => {
    const score = calcHungerBar({
      categorySlug: "kahvaltiliklar",
      type: "KAHVALTI",
      averageCalories: 280,
      protein: 16,
      carbs: 10,
      fat: 18,
      ingredientNames: ["Yumurta", "Domates", "Biber", "Tereyağı"],
    });
    expect(score).toBeGreaterThanOrEqual(5);
    expect(score).toBeLessThanOrEqual(7);
  });
});

describe("calcHungerBar, edge cases", () => {
  it("tüm null nutrition, sadece base + keyword", () => {
    const score = calcHungerBar({
      categorySlug: "et-yemekleri",
      type: "YEMEK",
      averageCalories: null,
      protein: null,
      carbs: null,
      fat: null,
      ingredientNames: ["Kuru fasulye"],
    });
    // base 5.5 + legume 1 = 6.5 → 7
    expect(score).toBe(7);
  });

  it("bilinmeyen kategori default 3", () => {
    const score = calcHungerBar({
      categorySlug: "nonexistent-category",
      type: "YEMEK",
      averageCalories: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
      ingredientNames: [],
    });
    // base 3 + 0.33 + 0.25 + 0.075 = 3.65 → 4
    expect(score).toBeGreaterThanOrEqual(3);
    expect(score).toBeLessThanOrEqual(5);
  });

  it("clamp üst limit 10, aşırı protein/carbs da kapanır", () => {
    const score = calcHungerBar({
      categorySlug: "et-yemekleri",
      type: "YEMEK",
      averageCalories: 1500,
      protein: 100,
      carbs: 200,
      fat: 80,
      ingredientNames: ["Kuru fasulye", "Bulgur", "Patlıcan"],
    });
    expect(score).toBe(HUNGER_BAR_MAX);
  });

  it("clamp alt limit 1, yok denecek kadar küçük değer bile 1", () => {
    const score = calcHungerBar({
      categorySlug: "icecekler",
      type: "ICECEK",
      averageCalories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ingredientNames: ["Su"],
    });
    expect(score).toBe(HUNGER_BAR_MIN);
  });

  it("Turkish-aware keyword match, 'mercimek' lowercase'li bulur", () => {
    const score = calcHungerBar({
      categorySlug: "corbalar",
      type: "CORBA",
      averageCalories: 180,
      protein: 12,
      carbs: 28,
      fat: 3,
      ingredientNames: ["Kırmızı Mercimek"], // uppercase M
    });
    // legume bonus aktif olmalı
    const withMercimek = score;
    const withoutMercimek = calcHungerBar({
      categorySlug: "corbalar",
      type: "CORBA",
      averageCalories: 180,
      protein: 12,
      carbs: 28,
      fat: 3,
      ingredientNames: ["Su"],
    });
    expect(withMercimek).toBeGreaterThan(withoutMercimek);
  });

  it("Turkish-aware, 'çavdar' ascii fold ile eşleşir (breakdown check)", () => {
    const bdWith = calcHungerBarWithBreakdown({
      categorySlug: "hamur-isleri",
      type: "YEMEK",
      averageCalories: 250,
      protein: 8,
      carbs: 45,
      fat: 5,
      ingredientNames: ["Çavdar unu", "Tuz", "Su"],
    });
    const bdWithout = calcHungerBarWithBreakdown({
      categorySlug: "hamur-isleri",
      type: "YEMEK",
      averageCalories: 250,
      protein: 8,
      carbs: 45,
      fat: 5,
      ingredientNames: ["Beyaz un", "Tuz", "Su"],
    });
    expect(bdWith.grainBonus).toBe(0.5);
    expect(bdWithout.grainBonus).toBe(0);
    expect(bdWith.raw).toBeGreaterThan(bdWithout.raw);
  });

  it("TATLI penalty, TATLI olmasaydı daha yüksek skorlardı", () => {
    const dessert = calcHungerBar({
      categorySlug: "tatlilar",
      type: "TATLI",
      averageCalories: 300,
      protein: 5,
      carbs: 45,
      fat: 8,
      ingredientNames: ["Un", "Şeker"],
    });
    const savory = calcHungerBar({
      categorySlug: "tatlilar",
      type: "YEMEK",
      averageCalories: 300,
      protein: 5,
      carbs: 45,
      fat: 8,
      ingredientNames: ["Un", "Şeker"],
    });
    expect(dessert).toBeLessThan(savory);
  });

  it("liquid multiplier ICECEK/KOKTEYL baseline'ı 0.8 kez düşürür", () => {
    const base = mk({
      categorySlug: "icecekler",
      type: "ICECEK",
      averageCalories: 200,
      protein: 5,
      carbs: 30,
      fat: 2,
      ingredientNames: ["Meyve suyu"],
    });
    const solidBase = mk({
      categorySlug: "icecekler",
      type: "TATLI", // liquid multiplier uygulanmaz
      averageCalories: 200,
      protein: 5,
      carbs: 30,
      fat: 2,
      ingredientNames: ["Meyve suyu"],
    });
    const liquid = calcHungerBar(base);
    const nonLiquid = calcHungerBar(solidBase);
    expect(liquid).toBeLessThanOrEqual(nonLiquid);
  });
});

describe("calcHungerBarWithBreakdown, detay", () => {
  it("breakdown tüm bileşenleri expose eder", () => {
    const bd = calcHungerBarWithBreakdown({
      categorySlug: "baklagil-yemekleri",
      type: "YEMEK",
      averageCalories: 350,
      protein: 20,
      carbs: 45,
      fat: 8,
      ingredientNames: ["Mercimek", "Bulgur", "Patates"],
    });
    expect(bd.base).toBe(5.5);
    expect(bd.proteinBonus).toBeCloseTo(20 / 15, 3);
    expect(bd.fatBonus).toBeCloseTo(8 / 40, 3);
    expect(bd.carbsBonus).toBeCloseTo(45 / 60, 3);
    expect(bd.legumeBonus).toBe(1);
    expect(bd.grainBonus).toBe(0.5);
    expect(bd.vegBonus).toBe(0.3);
    expect(bd.dessertPenalty).toBe(0);
    expect(bd.liquidMultiplier).toBe(1.0);
    // base 5.5 + 1.33 + 0.2 + 0.75 + 1 + 0.5 + 0.3 = 9.58 → round 10
    expect(bd.final).toBe(10);
  });

  it("TATLI için carbs bonus /120 * 0.5 formülü", () => {
    const bd = calcHungerBarWithBreakdown({
      categorySlug: "tatlilar",
      type: "TATLI",
      averageCalories: 300,
      protein: 4,
      carbs: 60,
      fat: 10,
      ingredientNames: ["Un", "Şeker"],
    });
    expect(bd.carbsBonus).toBeCloseTo((60 / 120) * 0.5, 3);
    expect(bd.dessertPenalty).toBe(-1);
  });
});

describe("hungerBarLabel, i18n", () => {
  it("tr, low bucket", () => {
    expect(hungerBarLabel(2, "tr")).toContain("Az tok");
  });
  it("tr, high bucket", () => {
    expect(hungerBarLabel(7, "tr")).toContain("Çok tok");
  });
  it("tr, max bucket", () => {
    expect(hungerBarLabel(10, "tr")).toContain("Uzun süre");
  });
  it("en, mid bucket", () => {
    expect(hungerBarLabel(5, "en")).toContain("Moderate");
  });
  it("de, high bucket", () => {
    expect(hungerBarLabel(7, "de")).toContain("Stark");
  });
  it("clamp, 15 hungerBarLabel'de 10 gibi davranır", () => {
    expect(hungerBarLabel(15)).toContain("10/10");
  });
});
