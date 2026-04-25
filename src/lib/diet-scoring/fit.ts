/**
 * Smooth fit fonksiyonları, diyet kriterlerinin 0..1 oranı hesaplar.
 * Binary scoring yerine yumuşak geçiş: değer hedefe yaklaştıkça oran
 * artar, hedef aralığı dışında lineer ceza. UI breakdown'da bar render
 * edilir.
 *
 * Tüm fonksiyonlar saf, NaN-safe, 0..1 clamped. Test edilebilir.
 */

/**
 * Aralık-hedef fit. Üçlü değer: min (geçiş başlangıcı), ideal (tam puan),
 * max (kabul edilen üst sınır). Idealdan max'e kadar hafif ceza var
 * (tepedeki plato değil; "fazla" da kötü, ortayı seç).
 *
 * Örnek: fit_range(kcal, {min: 350, ideal: 500, max: 650})
 *   - kcal=500 → 1.00 (ideal)
 *   - kcal=425 → 0.50 (yarı yol)
 *   - kcal=575 → 0.85 (max'a doğru hafif düşüş)
 *   - kcal=200 → 0.00 (under min)
 *   - kcal=900 → 0.00 (over 2x max)
 */
export function fitRange(
  value: number | null,
  range: { min: number; ideal: number; max: number },
): number {
  if (value === null || !Number.isFinite(value)) return 0;
  const { min, ideal, max } = range;
  if (value < min) return 0;
  if (value <= ideal) {
    // min..ideal: lineer 0..1
    return clamp01((value - min) / (ideal - min));
  }
  if (value <= max) {
    // ideal..max: 1..0.7 hafif ceza
    return clamp01(1 - ((value - ideal) / (max - ideal)) * 0.3);
  }
  // max üstü: lineer 0.7'den 0'a, max'in 2 katında 0
  return clamp01(0.7 - ((value - max) / max) * 0.7);
}

/**
 * Üst sınır fit. value <= threshold ise 1.0; üstüne çıktıkça lineer azalır,
 * 2*threshold'da 0. "Düşük şeker", "düşük sodyum" gibi azaltma hedefli
 * kriterler için.
 *
 * Örnek: fitUpper(sugar, 10)
 *   - 5g → 1.00
 *   - 10g → 1.00
 *   - 15g → 0.50
 *   - 20g → 0.00
 */
export function fitUpper(value: number | null, threshold: number): number {
  if (value === null || !Number.isFinite(value)) return 0;
  if (value <= threshold) return 1;
  if (threshold <= 0) return 0;
  return clamp01(1 - (value - threshold) / threshold);
}

/**
 * Alt sınır fit. value >= threshold ise 1.0; altında lineer azalır, 0'da 0.
 * "Yüksek protein", "yüksek lif" gibi artırma hedefli.
 *
 * Örnek: fitLower(protein, 25)
 *   - 30g → 1.00
 *   - 25g → 1.00
 *   - 12.5g → 0.50
 *   - 0g → 0.00
 */
export function fitLower(value: number | null, threshold: number): number {
  if (value === null || !Number.isFinite(value)) return 0;
  if (value >= threshold) return 1;
  if (threshold <= 0) return 1;
  return clamp01(value / threshold);
}

/**
 * Macro yüzdesini hesapla, makro kalorinin toplam macro kalorisine oranı.
 * Recipe.averageCalories yerine macro hesabı (4*p + 4*c + 9*f) baz alınır.
 * Bu, Recipe.averageCalories ile macro toplamı tutarsızsa (yuvarlama,
 * mikro nutrient) doğru oran verir.
 */
export function macroPercents(p: number, c: number, f: number) {
  const total = p * 4 + c * 4 + f * 9;
  if (total < 50) return { proteinPct: 0, carbsPct: 0, fatPct: 0, valid: false };
  return {
    proteinPct: (p * 4) / total,
    carbsPct: (c * 4) / total,
    fatPct: (f * 9) / total,
    valid: true,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
