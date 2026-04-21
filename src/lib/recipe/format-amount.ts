/**
 * Ingredient amount formatter, web + PDF arasında tutarlı gösterim.
 *
 * GPT dış audit'i bir Empanada tarifinde web "0.8 su bardağı" gösterirken
 * PDF "0.75 su bardağı" gösterdiğini yakaladı. Kök neden: web
 * `IngredientList` içinde `parseFloat(amount) * multiplier` sonra
 * `toFixed(1)` (0.75 → 0.8) uyguluyordu; PDF ise ham string'i basıyordu.
 * İki canal aynı helper'ı kullansın.
 *
 * Kural:
 *   - Boş veya sayısal olmayan amount → olduğu gibi (ör. "bir tutam")
 *   - Integer sonuç (scaled === floor) → tam sayı yaz (ör. 2, 6)
 *   - Fraksiyon → 1 ondalık basamak (0.75 → 0.8, 1.25 → 1.3)
 *
 * Locale düşüncesi: `toFixed` ondalık için nokta kullanır. Türkçe sunumda
 * virgül tercih edilse bile seed bazında input "0.75" noktalı, PDF + web
 * aynı glyph ile çizsin diye nokta korunuyor. İleride Intl.NumberFormat
 * ile lokalize edilebilir (tek yerde, kullanıcı locale'ine göre).
 */
export function formatIngredientAmount(
  amount: string,
  multiplier: number = 1,
): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  const scaled = num * multiplier;
  if (scaled === Math.floor(scaled)) return String(scaled);
  return scaled.toFixed(1);
}
