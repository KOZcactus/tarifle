/**
 * Diyet preset katalogu (oturum 20, DIET_SCORE_PLAN.md K1=B*).
 *
 * Faz 1 (mevcut macro verisi ile, %100 doğru):
 *   1. dengeli           - Dengeli Beslenme
 *   2. yuksek-protein    - Yüksek Protein
 *   3. dusuk-kalori      - Düşük Kalori
 *   4. vejetaryen-dengeli- Vejetaryen Dengeli
 *   5. vegan-dengeli     - Vegan Dengeli
 *
 * Faz 2 (USDA enrichment sonrası eklenir, Faz 1'de Beta proxy):
 *   6. dusuk-seker       - Düşük Şeker (Faz 1'de proxy: rafine-tahıl-azlığı)
 *
 * Tüm preset'lerin criteria max toplamı = 100. Scorer runtime check eder.
 */

import type { DietProfile, RecipeForScoring } from "./types";
import { fitRange, fitUpper, fitLower, macroPercents } from "./fit";

const VEGETARIAN_TAGS = ["vejetaryen", "vegetarian"];
const VEGAN_TAGS = ["vegan"];

/**
 * Preset 1: Dengeli Beslenme (genel sağlıklı pattern).
 * Macro %15-25 protein / %45-55 carbs / %25-35 fat, kcal 350-600 ideal.
 */
const DENGELI: DietProfile = {
  slug: "dengeli",
  name: "Dengeli Beslenme",
  description: "Protein, karbonhidrat, yağ dengesi sağlıklı bir tabakta uygun oranlarda olsun. Genel günlük tabağına yaklaşan tarif çıkarır.",
  emoji: "⚖️",
  phase: 1,
  requiresEnrichedData: false,
  criteria: [
    {
      slug: "macro-balance",
      label: "Makro denge",
      max: 40,
      compute: (r) => {
        const p = Number(r.protein ?? 0);
        const c = Number(r.carbs ?? 0);
        const f = Number(r.fat ?? 0);
        const m = macroPercents(p, c, f);
        if (!m.valid) {
          return { score: 0, fit: 0, status: "bad", note: "Makro verisi yok" };
        }
        // Üç ayrı alan, her biri için fit_range, ortalama
        const pFit = fitRange(m.proteinPct, { min: 0.10, ideal: 0.20, max: 0.30 });
        const cFit = fitRange(m.carbsPct, { min: 0.35, ideal: 0.50, max: 0.60 });
        const fFit = fitRange(m.fatPct, { min: 0.20, ideal: 0.30, max: 0.40 });
        const fit = (pFit + cFit + fFit) / 3;
        return {
          score: Math.round(fit * 40),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `Protein %${Math.round(m.proteinPct * 100)} · Karbonhidrat %${Math.round(m.carbsPct * 100)} · Yağ %${Math.round(m.fatPct * 100)}`,
        };
      },
    },
    {
      slug: "calorie-range",
      label: "Kalori aralığı",
      max: 25,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 250, ideal: 500, max: 700 });
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `${r.averageCalories ?? "?"} kcal/porsiyon`,
        };
      },
    },
    {
      slug: "satiety",
      label: "Doyuruculuk",
      max: 20,
      compute: (r) => {
        const fit = fitRange(r.hungerBar, { min: 4, ideal: 7, max: 10 });
        return {
          score: Math.round(fit * 20),
          fit,
          status: fit >= 0.6 ? "ok" : "warning",
          note: r.hungerBar !== null ? `Açlık skoru ${r.hungerBar}/10` : "Doyuruculuk verisi yok",
        };
      },
    },
    {
      slug: "protein-adequate",
      label: "Yeterli protein",
      max: 15,
      compute: (r) => {
        const fit = fitLower(Number(r.protein ?? 0), 15);
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${Number(r.protein ?? 0)} g protein`,
        };
      },
    },
  ],
};

/**
 * Preset 2: Yüksek Protein (atlet, kas yapımı, doygunluk).
 * Hedef: ≥25g protein/porsiyon, kcal:protein oranı düşük.
 */
const YUKSEK_PROTEIN: DietProfile = {
  slug: "yuksek-protein",
  name: "Yüksek Protein",
  description: "Spor sonrası, kas yapımı veya tokluk için protein yoğun tariflerde +. Genelde tavuk, balık, baklagiller, yumurta ön planda.",
  emoji: "💪",
  phase: 1,
  requiresEnrichedData: false,
  criteria: [
    {
      slug: "protein-amount",
      label: "Protein miktarı",
      max: 45,
      compute: (r) => {
        const protein = Number(r.protein ?? 0);
        const fit = fitLower(protein, 25);
        return {
          score: Math.round(fit * 45),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${protein} g protein/porsiyon`,
        };
      },
    },
    {
      slug: "protein-density",
      label: "Protein yoğunluğu",
      max: 25,
      compute: (r) => {
        const protein = Number(r.protein ?? 0);
        const kcal = r.averageCalories ?? 0;
        if (kcal < 100 || protein < 1) {
          return { score: 0, fit: 0, status: "bad", note: "Hesaplama için yetersiz veri" };
        }
        // kcal/protein oranı, düşükse iyi (10-15 ideal). 20+ kötü.
        const ratio = kcal / protein;
        // fit_upper(ratio, 15) ama 30 kötü
        let fit: number;
        if (ratio <= 12) fit = 1;
        else if (ratio <= 20) fit = 1 - (ratio - 12) / 8 * 0.5;
        else fit = Math.max(0, 0.5 - (ratio - 20) / 20 * 0.5);
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `${Math.round(ratio)} kcal/g protein`,
        };
      },
    },
    {
      slug: "satiety",
      label: "Doyuruculuk",
      max: 20,
      compute: (r) => {
        const fit = fitRange(r.hungerBar, { min: 5, ideal: 8, max: 10 });
        return {
          score: Math.round(fit * 20),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: r.hungerBar !== null ? `Açlık skoru ${r.hungerBar}/10` : "Doyuruculuk verisi yok",
        };
      },
    },
    {
      slug: "calorie-reasonable",
      label: "Makul kalori",
      max: 10,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 300, ideal: 500, max: 800 });
        return {
          score: Math.round(fit * 10),
          fit,
          status: fit >= 0.6 ? "ok" : "warning",
          note: `${r.averageCalories ?? "?"} kcal`,
        };
      },
    },
  ],
};

/**
 * Preset 3: Düşük Kalori (kilo verme, hafif öğün).
 * Hedef: ≤400 kcal porsiyon başı, hungerBar yüksek (doyuruculuk).
 */
const DUSUK_KALORI: DietProfile = {
  slug: "dusuk-kalori",
  name: "Düşük Kalori",
  description: "Kilo verme veya hafif öğün için kalori yoğunluğu düşük tarifler. Doyuruculuk önemli, çorba ve salata ön planda.",
  emoji: "🌿",
  phase: 1,
  requiresEnrichedData: false,
  criteria: [
    {
      slug: "calorie-low",
      label: "Düşük kalori",
      max: 50,
      compute: (r) => {
        const kcal = r.averageCalories ?? 9999;
        const fit = fitUpper(kcal, 350);
        return {
          score: Math.round(fit * 50),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${kcal} kcal/porsiyon`,
        };
      },
    },
    {
      slug: "satiety-bonus",
      label: "Doyuruculuk bonusu",
      max: 25,
      compute: (r) => {
        const fit = fitRange(r.hungerBar, { min: 5, ideal: 8, max: 10 });
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: r.hungerBar !== null
            ? `Açlık skoru ${r.hungerBar}/10`
            : "Doyuruculuk verisi yok",
        };
      },
    },
    {
      slug: "protein-floor",
      label: "Yeterli protein",
      max: 15,
      compute: (r) => {
        const protein = Number(r.protein ?? 0);
        const fit = fitLower(protein, 12);
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${protein} g protein, hedef 12g+`,
        };
      },
    },
    {
      slug: "fat-moderate",
      label: "Ölçülü yağ",
      max: 10,
      compute: (r) => {
        const fat = Number(r.fat ?? 0);
        const fit = fitUpper(fat, 15);
        return {
          score: Math.round(fit * 10),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${fat} g yağ`,
        };
      },
    },
  ],
};

/**
 * Preset 4: Vejetaryen Dengeli.
 * Vegetarian tag + balanced macros + protein ≥15g (eğer vejetaryen değilse
 * 0 puan, hard gate).
 */
const VEJETARYEN_DENGELI: DietProfile = {
  slug: "vejetaryen-dengeli",
  name: "Vejetaryen Dengeli",
  description: "Et içermez, makro dengesi yerinde, protein bitki + süt + yumurta kaynaklarıyla yeterli.",
  emoji: "🥗",
  phase: 1,
  requiresEnrichedData: false,
  criteria: [
    {
      slug: "is-vegetarian",
      label: "Vejetaryen uyumu",
      max: 35,
      compute: (r) => {
        const isVeg =
          r.tagSlugs.some((t) => VEGETARIAN_TAGS.includes(t)) ||
          r.tagSlugs.some((t) => VEGAN_TAGS.includes(t));
        return {
          score: isVeg ? 35 : 0,
          fit: isVeg ? 1 : 0,
          status: isVeg ? "ok" : "bad",
          note: isVeg ? "Vejetaryen tarif" : "Et içerir, vejetaryen değil",
        };
      },
    },
    {
      slug: "protein-adequate",
      label: "Bitki proteini yeterli",
      max: 25,
      compute: (r) => {
        const protein = Number(r.protein ?? 0);
        const fit = fitLower(protein, 15);
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${protein} g protein, hedef 15g+`,
        };
      },
    },
    {
      slug: "macro-balance",
      label: "Makro denge",
      max: 25,
      compute: (r) => {
        const m = macroPercents(
          Number(r.protein ?? 0),
          Number(r.carbs ?? 0),
          Number(r.fat ?? 0),
        );
        if (!m.valid) return { score: 0, fit: 0, status: "bad", note: "Makro verisi yok" };
        const pFit = fitRange(m.proteinPct, { min: 0.10, ideal: 0.20, max: 0.30 });
        const cFit = fitRange(m.carbsPct, { min: 0.35, ideal: 0.50, max: 0.60 });
        const fFit = fitRange(m.fatPct, { min: 0.20, ideal: 0.30, max: 0.40 });
        const fit = (pFit + cFit + fFit) / 3;
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `Protein %${Math.round(m.proteinPct * 100)} · Karbonhidrat %${Math.round(m.carbsPct * 100)} · Yağ %${Math.round(m.fatPct * 100)}`,
        };
      },
    },
    {
      slug: "calorie-range",
      label: "Kalori aralığı",
      max: 15,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 300, ideal: 500, max: 700 });
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${r.averageCalories ?? "?"} kcal`,
        };
      },
    },
  ],
};

/**
 * Preset 5: Vegan Dengeli.
 * Vegan tag (hard gate) + bitki proteini ≥12g + balanced macros + B12 uyarı
 * (B12 sinyali yok henüz, Faz 3 ek).
 */
const VEGAN_DENGELI: DietProfile = {
  slug: "vegan-dengeli",
  name: "Vegan Dengeli",
  description: "Hayvansal ürün içermez. Baklagil, soya, tofu, kuruyemiş ile bitki proteini yeterli olsun.",
  emoji: "🌱",
  phase: 1,
  requiresEnrichedData: false,
  criteria: [
    {
      slug: "is-vegan",
      label: "Vegan uyumu",
      max: 40,
      compute: (r) => {
        const isVegan = r.tagSlugs.some((t) => VEGAN_TAGS.includes(t));
        return {
          score: isVegan ? 40 : 0,
          fit: isVegan ? 1 : 0,
          status: isVegan ? "ok" : "bad",
          note: isVegan ? "Vegan tarif" : "Hayvansal ürün içerir",
        };
      },
    },
    {
      slug: "plant-protein",
      label: "Bitki proteini",
      max: 30,
      compute: (r) => {
        const protein = Number(r.protein ?? 0);
        const fit = fitLower(protein, 12);
        return {
          score: Math.round(fit * 30),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${protein} g protein, hedef 12g+ bitki kaynaklı`,
        };
      },
    },
    {
      slug: "macro-balance",
      label: "Makro denge",
      max: 20,
      compute: (r) => {
        const m = macroPercents(
          Number(r.protein ?? 0),
          Number(r.carbs ?? 0),
          Number(r.fat ?? 0),
        );
        if (!m.valid) return { score: 0, fit: 0, status: "bad", note: "Makro verisi yok" };
        // Vegan'da carbs biraz daha yüksek olabilir (50-65 ideal)
        const pFit = fitRange(m.proteinPct, { min: 0.10, ideal: 0.18, max: 0.28 });
        const cFit = fitRange(m.carbsPct, { min: 0.40, ideal: 0.55, max: 0.65 });
        const fFit = fitRange(m.fatPct, { min: 0.20, ideal: 0.28, max: 0.40 });
        const fit = (pFit + cFit + fFit) / 3;
        return {
          score: Math.round(fit * 20),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `Protein %${Math.round(m.proteinPct * 100)} · Karbonhidrat %${Math.round(m.carbsPct * 100)} · Yağ %${Math.round(m.fatPct * 100)}`,
        };
      },
    },
    {
      slug: "calorie-range",
      label: "Kalori aralığı",
      max: 10,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 300, ideal: 500, max: 700 });
        return {
          score: Math.round(fit * 10),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${r.averageCalories ?? "?"} kcal`,
        };
      },
    },
  ],
};

/**
 * Preset 6: Düşük Şeker (Faz 2 USDA enrichment ile real sugar verisi).
 *
 * RecipeNutrition.sugarPerServing varsa o kullanilir; yoksa carbs proxy
 * fallback. Top 30 ingredient seed sonrasi tariflerin %78'inde sugar
 * verisi mevcut.
 */
const DUSUK_SEKER: DietProfile = {
  slug: "dusuk-seker",
  name: "Düşük Şeker",
  description: "Şeker yükü düşük tarifler. Kan şekerini ani yükseltmeyen, dengeli karbonhidrat. Diyabet dostu yaklaşım.",
  emoji: "🩺",
  phase: 2,
  requiresEnrichedData: true,
  criteria: [
    {
      slug: "sugar-low",
      label: "Şeker miktarı",
      max: 50,
      compute: (r) => {
        const sugar = r.sugarPerServing;
        if (sugar !== undefined && sugar !== null) {
          // Real veri: ≤10g/porsiyon ideal, 20g'da yarı puan
          const fit = fitUpper(sugar, 10);
          return {
            score: Math.round(fit * 50),
            fit,
            status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
            note: `${sugar} g şeker / porsiyon`,
          };
        }
        // Fallback: carbs proxy
        const carbs = Number(r.carbs ?? 999);
        const fit = fitUpper(carbs, 30);
        return {
          score: Math.round(fit * 50),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${carbs} g karbonhidrat (şeker verisi yok, proxy)`,
        };
      },
    },
    {
      slug: "protein-balance",
      label: "Protein dengesi",
      max: 25,
      compute: (r) => {
        const protein = Number(r.protein ?? 0);
        const fit = fitLower(protein, 18);
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `${protein} g protein, kan şekerini dengeler`,
        };
      },
    },
    {
      slug: "calorie-portion",
      label: "Porsiyon kontrolü",
      max: 15,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 200, ideal: 400, max: 550 });
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${r.averageCalories ?? "?"} kcal/porsiyon`,
        };
      },
    },
    {
      slug: "fiber-bonus",
      label: "Lif bonusu",
      max: 10,
      compute: (r) => {
        const fiber = r.fiberPerServing;
        if (fiber === undefined || fiber === null) {
          return {
            score: 0,
            fit: 0,
            status: "warning",
            note: "Lif verisi yok",
          };
        }
        const fit = fitLower(fiber, 5);
        return {
          score: Math.round(fit * 10),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `${fiber} g lif (yüksek lif kan şekerini yavaşlatır)`,
        };
      },
    },
  ],
};

/**
 * Preset 7: Yüksek Lif (Faz 2 USDA enrichment).
 * Hedef: ≥8g fiber/porsiyon, tam tahıl + baklagil + sebze ağırlıklı.
 */
const YUKSEK_LIF: DietProfile = {
  slug: "yuksek-lif",
  name: "Yüksek Lif",
  description: "Sindirim sağlığı için lif yoğun tarifler. Tam tahıl, baklagil, sebze ağırlıklı; tokluk uzun sürer.",
  emoji: "🌾",
  phase: 2,
  requiresEnrichedData: true,
  criteria: [
    {
      slug: "fiber-high",
      label: "Lif miktarı",
      max: 50,
      compute: (r) => {
        const fiber = r.fiberPerServing;
        if (fiber === undefined || fiber === null) {
          return {
            score: 0,
            fit: 0,
            status: "bad",
            note: "Lif verisi yok",
          };
        }
        const fit = fitLower(fiber, 8);
        return {
          score: Math.round(fit * 50),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${fiber} g lif / porsiyon`,
        };
      },
    },
    {
      slug: "satiety",
      label: "Doyuruculuk",
      max: 20,
      compute: (r) => {
        const fit = fitRange(r.hungerBar, { min: 5, ideal: 8, max: 10 });
        return {
          score: Math.round(fit * 20),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: r.hungerBar !== null ? `Açlık skoru ${r.hungerBar}/10` : "Doyuruculuk verisi yok",
        };
      },
    },
    {
      slug: "calorie-reasonable",
      label: "Makul kalori",
      max: 15,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 300, ideal: 500, max: 700 });
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${r.averageCalories ?? "?"} kcal`,
        };
      },
    },
    {
      slug: "protein-floor",
      label: "Yeterli protein",
      max: 15,
      compute: (r) => {
        const protein = Number(r.protein ?? 0);
        const fit = fitLower(protein, 12);
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${protein} g protein`,
        };
      },
    },
  ],
};

/**
 * Preset 8: Düşük Sodyum (kalp sağlığı, hipertansiyon).
 * Hedef: ≤600mg sodium/porsiyon (DASH diyet hedefi 2300mg/gün, /4 öğün).
 */
const DUSUK_SODYUM: DietProfile = {
  slug: "dusuk-sodyum",
  name: "Düşük Sodyum",
  description: "Kalp sağlığı, hipertansiyon dostu. Tuz tüketimini sınırlar, fazla işlenmiş ürün içermez.",
  emoji: "❤️",
  phase: 2,
  requiresEnrichedData: true,
  criteria: [
    {
      slug: "sodium-low",
      label: "Sodyum miktarı",
      max: 55,
      compute: (r) => {
        const sodium = r.sodiumPerServing;
        if (sodium === undefined || sodium === null) {
          return {
            score: 0,
            fit: 0,
            status: "bad",
            note: "Sodyum verisi yok",
          };
        }
        const fit = fitUpper(sodium, 600);
        return {
          score: Math.round(fit * 55),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${sodium} mg sodyum / porsiyon`,
        };
      },
    },
    {
      slug: "satfat-moderate",
      label: "Doymuş yağ ölçülü",
      max: 20,
      compute: (r) => {
        const satFat = r.satFatPerServing;
        if (satFat === undefined || satFat === null) {
          // Fallback: toplam yağ ile
          const fat = Number(r.fat ?? 0);
          const fit = fitUpper(fat, 20);
          return {
            score: Math.round(fit * 20),
            fit,
            status: fit >= 0.7 ? "ok" : "warning",
            note: `${fat} g toplam yağ (doymuş yağ verisi yok)`,
          };
        }
        const fit = fitUpper(satFat, 7);
        return {
          score: Math.round(fit * 20),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `${satFat} g doymuş yağ`,
        };
      },
    },
    {
      slug: "calorie-balanced",
      label: "Kalori dengesi",
      max: 15,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 250, ideal: 450, max: 650 });
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${r.averageCalories ?? "?"} kcal`,
        };
      },
    },
    {
      slug: "fiber-bonus",
      label: "Lif bonusu",
      max: 10,
      compute: (r) => {
        const fiber = r.fiberPerServing;
        if (fiber === undefined || fiber === null) {
          return { score: 0, fit: 0, status: "warning", note: "Lif verisi yok" };
        }
        const fit = fitLower(fiber, 4);
        return {
          score: Math.round(fit * 10),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${fiber} g lif`,
        };
      },
    },
  ],
};

/**
 * Preset 9: Akdeniz Diyeti.
 * Zeytinyağı + balık + tahıl + lif + düşük doymuş yağ composite.
 */
const AKDENIZ: DietProfile = {
  slug: "akdeniz",
  name: "Akdeniz Diyeti",
  description: "Akdeniz beslenme paterni: zeytinyağı, balık, sebze, tam tahıl, baklagil. Yüksek lif + sağlıklı yağ + düşük doymuş yağ.",
  emoji: "🫒",
  phase: 2,
  requiresEnrichedData: true,
  criteria: [
    {
      slug: "satfat-low",
      label: "Doymuş yağ düşük",
      max: 25,
      compute: (r) => {
        const satFat = r.satFatPerServing;
        if (satFat === undefined || satFat === null) {
          return { score: 0, fit: 0, status: "warning", note: "Doymuş yağ verisi yok" };
        }
        const fit = fitUpper(satFat, 5);
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `${satFat} g doymuş yağ`,
        };
      },
    },
    {
      slug: "fiber-good",
      label: "Yeterli lif",
      max: 25,
      compute: (r) => {
        const fiber = r.fiberPerServing;
        if (fiber === undefined || fiber === null) {
          return { score: 0, fit: 0, status: "warning", note: "Lif verisi yok" };
        }
        const fit = fitLower(fiber, 6);
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `${fiber} g lif`,
        };
      },
    },
    {
      slug: "macro-balance",
      label: "Akdeniz makro paterni",
      max: 25,
      compute: (r) => {
        const m = macroPercents(
          Number(r.protein ?? 0),
          Number(r.carbs ?? 0),
          Number(r.fat ?? 0),
        );
        if (!m.valid) return { score: 0, fit: 0, status: "bad", note: "Makro verisi yok" };
        // Akdeniz: protein %15-20, carb %45-55, fat %30-40 (yüksek mono-unsat)
        const pFit = fitRange(m.proteinPct, { min: 0.10, ideal: 0.18, max: 0.25 });
        const cFit = fitRange(m.carbsPct, { min: 0.40, ideal: 0.50, max: 0.60 });
        const fFit = fitRange(m.fatPct, { min: 0.25, ideal: 0.35, max: 0.45 });
        const fit = (pFit + cFit + fFit) / 3;
        return {
          score: Math.round(fit * 25),
          fit,
          status: fit >= 0.7 ? "ok" : fit >= 0.4 ? "warning" : "bad",
          note: `Protein %${Math.round(m.proteinPct * 100)} · Carb %${Math.round(m.carbsPct * 100)} · Fat %${Math.round(m.fatPct * 100)}`,
        };
      },
    },
    {
      slug: "calorie-balanced",
      label: "Kalori dengesi",
      max: 15,
      compute: (r) => {
        const fit = fitRange(r.averageCalories, { min: 350, ideal: 550, max: 750 });
        return {
          score: Math.round(fit * 15),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${r.averageCalories ?? "?"} kcal`,
        };
      },
    },
    {
      slug: "sodium-moderate",
      label: "Sodyum ölçülü",
      max: 10,
      compute: (r) => {
        const sodium = r.sodiumPerServing;
        if (sodium === undefined || sodium === null) {
          return { score: 0, fit: 0, status: "warning", note: "Sodyum verisi yok" };
        }
        const fit = fitUpper(sodium, 800);
        return {
          score: Math.round(fit * 10),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `${sodium} mg sodyum`,
        };
      },
    },
  ],
};

/**
 * Preset 10: Keto Hassas.
 * Hedef: net carb (carbs - fiber) ≤10g, fat ≥70% kalori.
 */
const KETO_HASSAS: DietProfile = {
  slug: "keto-hassas",
  name: "Keto Hassas",
  description: "Net karbonhidrat çok düşük, yağ ağırlıklı. Ketogenik beslenme prensiplerine yakın tarifler.",
  emoji: "🥑",
  phase: 2,
  requiresEnrichedData: true,
  criteria: [
    {
      slug: "net-carb-low",
      label: "Net karbonhidrat",
      max: 50,
      compute: (r) => {
        const carbs = Number(r.carbs ?? 999);
        const fiber = r.fiberPerServing;
        const netCarb = fiber !== undefined && fiber !== null ? carbs - fiber : carbs;
        const fit = fitUpper(netCarb, 10);
        const noteSuffix =
          fiber !== undefined && fiber !== null
            ? `${netCarb.toFixed(1)} g net carb (toplam ${carbs} - lif ${fiber})`
            : `${carbs} g toplam karbonhidrat (lif verisi yok)`;
        return {
          score: Math.round(fit * 50),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: noteSuffix,
        };
      },
    },
    {
      slug: "fat-ratio",
      label: "Yağ oranı",
      max: 30,
      compute: (r) => {
        const m = macroPercents(
          Number(r.protein ?? 0),
          Number(r.carbs ?? 0),
          Number(r.fat ?? 0),
        );
        if (!m.valid) return { score: 0, fit: 0, status: "bad", note: "Makro verisi yok" };
        // Keto: fat ≥70% kalori, fitLower
        const fit = fitLower(m.fatPct, 0.7);
        return {
          score: Math.round(fit * 30),
          fit,
          status: fit >= 0.8 ? "ok" : fit >= 0.5 ? "warning" : "bad",
          note: `Yağ kalori payı %${Math.round(m.fatPct * 100)}`,
        };
      },
    },
    {
      slug: "protein-moderate",
      label: "Protein ölçülü",
      max: 20,
      compute: (r) => {
        const m = macroPercents(
          Number(r.protein ?? 0),
          Number(r.carbs ?? 0),
          Number(r.fat ?? 0),
        );
        if (!m.valid) return { score: 0, fit: 0, status: "bad", note: "Makro verisi yok" };
        // Keto: protein 15-25%, ne çok düşük ne çok yüksek
        const fit = fitRange(m.proteinPct, { min: 0.10, ideal: 0.20, max: 0.30 });
        return {
          score: Math.round(fit * 20),
          fit,
          status: fit >= 0.7 ? "ok" : "warning",
          note: `Protein %${Math.round(m.proteinPct * 100)}`,
        };
      },
    },
  ],
};

export const DIET_PROFILES: ReadonlyArray<DietProfile> = [
  DENGELI,
  YUKSEK_PROTEIN,
  DUSUK_KALORI,
  VEJETARYEN_DENGELI,
  VEGAN_DENGELI,
  DUSUK_SEKER,
  YUKSEK_LIF,
  DUSUK_SODYUM,
  AKDENIZ,
  KETO_HASSAS,
];

export function getDietProfile(slug: string): DietProfile | null {
  return DIET_PROFILES.find((d) => d.slug === slug) ?? null;
}

export function listAvailableDietSlugs(): string[] {
  return DIET_PROFILES.map((d) => d.slug);
}

/**
 * Runtime sanity check. Her preset için criteria.max toplamı 100 olmalı.
 * Build time'da çalıştır (test'te), production'da silent.
 */
export function validateProfilesIntegrity(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const p of DIET_PROFILES) {
    const total = p.criteria.reduce((a, c) => a + c.max, 0);
    if (total !== 100) {
      errors.push(`Profile "${p.slug}" criteria max sum is ${total}, expected 100`);
    }
    const slugs = new Set(p.criteria.map((c) => c.slug));
    if (slugs.size !== p.criteria.length) {
      errors.push(`Profile "${p.slug}" has duplicate criterion slugs`);
    }
  }
  return { ok: errors.length === 0, errors };
}
