import type { Allergen } from "@prisma/client";

/**
 * Diyet programatik landing config, 5 diyet, her biri farklı filtre
 * mekanizmasına bağlanıyor:
 *
 *   - `vegan` / `vejetaryen` / `alkolsuz` → Tag slug filtresi (DB'de tag
 *     olarak tutulur; kullanıcıya net etiket)
 *   - `glutensiz` / `sutsuz` → Allergen exclusion (DB'de Allergen enum
 *     olarak; "GLUTEN içermeyen tarifler" semantiği)
 *
 * Her diyet için unique slug + label + açıklama + filter config. Slug
 * URL'e yansır (`/diyet/glutensiz`). Bu config tek yerde tutulur ki
 * sayfa + sitemap + internal linking aynı kaynaktan çeksin.
 */

export type DietSlug = "vegan" | "vejetaryen" | "glutensiz" | "sutsuz" | "alkolsuz";

export interface DietConfig {
  slug: DietSlug;
  labelTr: string;
  labelEn: string;
  emoji: string;
  descriptionTr: string;
  descriptionEn: string;
  /** Tag filter, DB'de bu tag slug'larını taşıyan tarifler listelenir. */
  tagSlug?: string;
  /** Allergen exclusion, bu allergenleri İÇERMEYEN tarifler listelenir. */
  excludeAllergen?: Allergen;
}

export const DIETS: readonly DietConfig[] = [
  {
    slug: "vegan",
    labelTr: "Vegan",
    labelEn: "Vegan",
    emoji: "🌱",
    tagSlug: "vegan",
    descriptionTr:
      "Vegan tarifler, hayvansal ürün içermeyen, bitki temelli pişirmeler. Çorbalar, salatalar, baklagil yemekleri ve tatlılar; sebzelerin, kuruyemişlerin ve tahılların öne çıktığı pratik seçenekler.",
    descriptionEn:
      "Vegan recipes, plant-based, no animal products. Soups, salads, legume dishes and desserts; practical picks where vegetables, nuts and grains lead.",
  },
  {
    slug: "vejetaryen",
    labelTr: "Vejetaryen",
    labelEn: "Vegetarian",
    emoji: "🥗",
    tagSlug: "vejetaryen",
    descriptionTr:
      "Vejetaryen tarifler, et içermeyen ama süt, yoğurt, peynir ve yumurta barındıran tarifler. Kahvaltılıklar, ev yemekleri, börekler ve tatlılar; bitki + süt ürünü ikilisinin zengin seçenekleri.",
    descriptionEn:
      "Vegetarian recipes, no meat, but dairy and eggs allowed. Breakfasts, home dishes, pastries and desserts; the rich plant + dairy pairing at its best.",
  },
  {
    slug: "glutensiz",
    labelTr: "Glutensiz",
    labelEn: "Gluten-free",
    emoji: "🌾",
    excludeAllergen: "GLUTEN",
    descriptionTr:
      "Malzeme listesine göre gluten içermeyen tarifler: buğday, arpa, çavdar ve türevleri dışında pirinç, mısır, karabuğday ve kinoa temelli seçenekler. Çapraz bulaşma takibi yapılmaz; çölyak hassasiyetinde malzeme etiketlerini doğrulamanız önerilir.",
    descriptionEn:
      "Recipes with no gluten in the ingredient list: rice, corn, buckwheat and quinoa-based dishes instead of wheat, barley and rye. Cross-contamination is not tracked; for celiac sensitivity please verify ingredient labels before cooking.",
  },
  {
    slug: "sutsuz",
    labelTr: "Sütsüz",
    labelEn: "Dairy-free",
    emoji: "🥛",
    excludeAllergen: "SUT",
    descriptionTr:
      "Malzeme listesine göre süt ürünü içermeyen tarifler: süt, yoğurt, tereyağı, peynir ve krema dışında bitkisel alternatif yağlar ve sularla hazırlanmış seçenekler. Çapraz bulaşma takibi yapılmaz; süt alerjisinde ürün etiketlerini doğrulamanız önerilir.",
    descriptionEn:
      "Recipes with no dairy in the ingredient list: prepared with plant-based oils and liquids instead of milk, yogurt, butter, cheese or cream. Cross-contamination is not tracked; for milk allergy please verify product labels before cooking.",
  },
  {
    slug: "alkolsuz",
    labelTr: "Alkolsüz",
    labelEn: "Non-alcoholic",
    emoji: "🥤",
    tagSlug: "alkolsuz",
    descriptionTr:
      "Alkolsüz içecek ve kokteyl tarifleri, mocktail, limonata, şurup, soğuk çay ve sıcak içecekler. Ailece paylaşıma uygun, taze otlar ve meyvelerle hazırlanmış ferahlık odaklı seçenekler.",
    descriptionEn:
      "Non-alcoholic drinks and mocktail recipes, lemonades, syrups, cold brews and hot drinks. Family-friendly, fresh with herbs and fruit, focused on refreshment.",
  },
];

export function dietConfigBySlug(slug: string): DietConfig | null {
  return DIETS.find((d) => d.slug === slug) ?? null;
}
