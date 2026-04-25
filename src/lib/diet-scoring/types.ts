/**
 * Diyet skoru tipleri (oturum 20, DIET_SCORE_PLAN.md).
 *
 * Skor 0-100, breakdown JSON DB'de saklanır (RecipeDietScore.breakdown).
 * Frontend "Diyet Uyumu" kartında breakdown'u criterion bazında listeler.
 */

import type { Allergen } from "@prisma/client";

/**
 * Skorlanan tarifin ihtiyaç duyduğumuz alanları (Prisma Recipe modelinden
 * subset). Skor hesaplaması için yeterli ve scorer'in unit testlerinde
 * kolayca mocklanabilir minimal interface.
 */
export interface RecipeForScoring {
  averageCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  hungerBar: number | null;
  /** Tag slug listesi, "vejetaryen" / "vegan" / "dusuk-kalorili" gibi */
  tagSlugs: string[];
  /** Allergen flag'leri, vegan/vejetaryen tutarlılık için */
  allergens: Allergen[];
  /** Faz 2 enrichment alanlari, RecipeNutrition tablosundan gelir.
   *  Null = NutritionData esleseme yetersiz, scorer proxy'ye fallback. */
  sugarPerServing?: number | null;
  fiberPerServing?: number | null;
  sodiumPerServing?: number | null;
  satFatPerServing?: number | null;
  /** Eslesme orani 0-1, approximationFlag karari icin. */
  nutritionMatchedRatio?: number | null;
}

/**
 * Tek kriter sonuc objesi. UI breakdown'da "Protein yeterli +25/30" formatı
 * için kullanılır; note opsiyonel açıklama satırı.
 */
export interface CriterionResult {
  /** İnsan-okunur kriter adı UI label'ı, i18n key */
  label: string;
  /** Hesaplanan ham puan (0..max) */
  score: number;
  /** Bu kriterin kazanılabilir maksimum puanı */
  max: number;
  /** Smooth fit oranı (0..1), debugging ve UI bar render için */
  fit: number;
  /** Opsiyonel açıklama satırı UI tooltip için ("Protein 28g, hedef 25g+") */
  note?: string;
  /** İkon hint, UI'da renk + ikon seçimi için: ok | warning | bad */
  status: "ok" | "warning" | "bad";
}

/**
 * Tarif skoru tam çıktı. score 0-100 yuvarlama; criteria UI'da liste +
 * progress bar render edilir.
 */
export interface ScoreResult {
  score: number;
  /** 5 katmanlı eşik etiketi UI renk + emoji seçimi için */
  rating: "excellent" | "good" | "fair" | "weak" | "poor";
  criteria: CriterionResult[];
  /** Beta etiketi, Faz 1'de tüm preset'lerde true; Faz 2 stabilize sonrası
   *  Kerem manuel false set edebilir. */
  isBeta: boolean;
  /** Eksik veri uyarısı, user-facing, UI'da disclaimer satırı */
  approximationFlag?: string;
}

/**
 * Bir kriter tanımı, profil dosyasında her preset için liste halinde.
 * compute(recipe) → CriterionResult.
 */
export interface CriterionDefinition {
  slug: string;
  label: string;
  max: number;
  /** Skoru hesaplayan saf fonksiyon, scorer.ts test edilebilir kalsın */
  compute: (recipe: RecipeForScoring) => Omit<CriterionResult, "label" | "max">;
}

/**
 * Diyet preset. Slug DB'deki user.dietProfile + RecipeDietScore.dietSlug
 * ile eşleşir. criteria toplam max puanları 100'e eşit olmalı (scorer
 * runtime check).
 */
export interface DietProfile {
  slug: string;
  /** UI label (TR), i18n key olabilir veya direkt string */
  name: string;
  /** Kısa açıklama, /ayarlar/diyet seçici altında */
  description: string;
  /** Emoji UI'da preset chip için */
  emoji: string;
  /** Faz 1 vs Faz 2 ayrımı, UI'da "Yakında" badge için */
  phase: 1 | 2 | 3;
  /** Veri eksikliği uyarısı, approximationFlag set'leniyor mu */
  requiresEnrichedData: boolean;
  criteria: CriterionDefinition[];
}
