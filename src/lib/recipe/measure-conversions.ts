/**
 * Ölçü dönüştürücü çekirdek mantık.
 *
 * Volume ve weight birimleri ayrı domain. Volume için ml base, weight
 * için gr base. Birim çevrimi taban birime gidip oradan hedef birime
 * iki adımda yapılır.
 *
 * Türk mutfağı standartları (yemek.com, nefisyemektarifleri.com):
 *   1 su bardağı = 240 ml
 *   1 çay bardağı = 100 ml
 *   1 kahve fincanı = 60 ml (espresso/Türk kahvesi)
 *   1 yemek kaşığı = 15 ml
 *   1 tatlı kaşığı = 10 ml
 *   1 çay kaşığı = 5 ml
 *
 * Uluslararası ölçek (US):
 *   1 cup = 240 ml
 *   1 fluid ounce = 29.5735 ml
 *   1 pint = 473 ml
 *   1 quart = 946 ml
 *   1 gallon = 3785 ml
 *
 * Weight (metric + imperial):
 *   1 ounce = 28.3495 gr
 *   1 pound = 453.59 gr
 */

export type MeasureDomain = "volume" | "weight";

export interface MeasureUnit {
  id: string;
  domain: MeasureDomain;
  /** Base birim cinsinden katsayı (volume → ml, weight → gr). */
  baseFactor: number;
  /** UI'da gösterilecek kısa etiket (TR). */
  shortTr: string;
  /** UI'da gösterilecek uzun etiket (TR). */
  longTr: string;
  /** UI'da gösterilecek kısa etiket (EN). */
  shortEn: string;
  /** UI'da gösterilecek uzun etiket (EN). */
  longEn: string;
}

export const MEASURE_UNITS: readonly MeasureUnit[] = [
  // Volume (base = ml)
  {
    id: "ml",
    domain: "volume",
    baseFactor: 1,
    shortTr: "ml",
    longTr: "mililitre",
    shortEn: "ml",
    longEn: "milliliter",
  },
  {
    id: "l",
    domain: "volume",
    baseFactor: 1000,
    shortTr: "l",
    longTr: "litre",
    shortEn: "L",
    longEn: "liter",
  },
  {
    id: "su-bardagi",
    domain: "volume",
    baseFactor: 240,
    shortTr: "su b.",
    longTr: "su bardağı",
    shortEn: "water glass",
    longEn: "water glass (240ml)",
  },
  {
    id: "cay-bardagi",
    domain: "volume",
    baseFactor: 100,
    shortTr: "çay b.",
    longTr: "çay bardağı",
    shortEn: "tea glass",
    longEn: "tea glass (100ml)",
  },
  {
    id: "kahve-fincani",
    domain: "volume",
    baseFactor: 60,
    shortTr: "kahve f.",
    longTr: "kahve fincanı",
    shortEn: "coffee cup",
    longEn: "coffee cup (60ml)",
  },
  {
    id: "yemek-kasigi",
    domain: "volume",
    baseFactor: 15,
    shortTr: "yk",
    longTr: "yemek kaşığı",
    shortEn: "tbsp",
    longEn: "tablespoon",
  },
  {
    id: "tatli-kasigi",
    domain: "volume",
    baseFactor: 10,
    shortTr: "tk",
    longTr: "tatlı kaşığı",
    shortEn: "dessert spoon",
    longEn: "dessert spoon (10ml)",
  },
  {
    id: "cay-kasigi",
    domain: "volume",
    baseFactor: 5,
    shortTr: "çk",
    longTr: "çay kaşığı",
    shortEn: "tsp",
    longEn: "teaspoon",
  },
  {
    id: "cup",
    domain: "volume",
    baseFactor: 240,
    shortTr: "cup",
    longTr: "cup (US)",
    shortEn: "cup",
    longEn: "cup (US, 240ml)",
  },
  {
    id: "fl-oz",
    domain: "volume",
    baseFactor: 29.5735,
    shortTr: "fl oz",
    longTr: "akışkan ons",
    shortEn: "fl oz",
    longEn: "fluid ounce",
  },
  // Weight (base = gr)
  {
    id: "gr",
    domain: "weight",
    baseFactor: 1,
    shortTr: "gr",
    longTr: "gram",
    shortEn: "g",
    longEn: "gram",
  },
  {
    id: "kg",
    domain: "weight",
    baseFactor: 1000,
    shortTr: "kg",
    longTr: "kilogram",
    shortEn: "kg",
    longEn: "kilogram",
  },
  {
    id: "oz",
    domain: "weight",
    baseFactor: 28.3495,
    shortTr: "oz",
    longTr: "ons",
    shortEn: "oz",
    longEn: "ounce",
  },
  {
    id: "lb",
    domain: "weight",
    baseFactor: 453.592,
    shortTr: "lb",
    longTr: "pound",
    shortEn: "lb",
    longEn: "pound",
  },
] as const;

const UNIT_BY_ID = new Map(MEASURE_UNITS.map((u) => [u.id, u]));

export function getUnit(id: string): MeasureUnit | undefined {
  return UNIT_BY_ID.get(id);
}

export function unitsByDomain(domain: MeasureDomain): readonly MeasureUnit[] {
  return MEASURE_UNITS.filter((u) => u.domain === domain);
}

/**
 * Bir ölçüyü kaynak birimden hedef birime çevirir. Domain uyumsuzluğunda
 * (volume vs weight) NaN döner; çağıran tarafın bu durumu kontrol etmesi
 * gerekir (ör. UI'da "ölçü dönüştürülemez" mesajı).
 */
export function convert(
  value: number,
  fromUnitId: string,
  toUnitId: string,
): number {
  const from = UNIT_BY_ID.get(fromUnitId);
  const to = UNIT_BY_ID.get(toUnitId);
  if (!from || !to) return NaN;
  if (from.domain !== to.domain) return NaN;
  const inBase = value * from.baseFactor;
  return inBase / to.baseFactor;
}

/**
 * Çevrim sonucu UI'da gösterilirken yuvarlama disiplini.
 * Tam sayıya yakınsa (örn. 240.0001) tam sayı, aksi halde 1-2 ondalık.
 * Çok küçük (< 1) sayılarda 2 ondalık; aksi 1.
 */
export function formatConverted(value: number): string {
  if (!isFinite(value)) return "?";
  if (Math.abs(value - Math.round(value)) < 0.05) {
    return String(Math.round(value));
  }
  if (Math.abs(value) < 1) {
    return value.toFixed(2);
  }
  return value.toFixed(1);
}

/**
 * Yaygın "tarif kullanıcı" çevrimleri. Hızlı referans tablosu için
 * (cup → ml gibi sıkça gerekli olanlar).
 */
export interface QuickReference {
  fromValue: number;
  fromUnitId: string;
  toUnitId: string;
}

export const QUICK_REFERENCES: readonly QuickReference[] = [
  { fromValue: 1, fromUnitId: "su-bardagi", toUnitId: "ml" },
  { fromValue: 1, fromUnitId: "cay-bardagi", toUnitId: "ml" },
  { fromValue: 1, fromUnitId: "yemek-kasigi", toUnitId: "ml" },
  { fromValue: 1, fromUnitId: "tatli-kasigi", toUnitId: "ml" },
  { fromValue: 1, fromUnitId: "cay-kasigi", toUnitId: "ml" },
  { fromValue: 1, fromUnitId: "cup", toUnitId: "ml" },
  { fromValue: 1, fromUnitId: "fl-oz", toUnitId: "ml" },
  { fromValue: 1, fromUnitId: "oz", toUnitId: "gr" },
  { fromValue: 1, fromUnitId: "lb", toUnitId: "gr" },
] as const;
