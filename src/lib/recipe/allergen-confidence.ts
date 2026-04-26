/**
 * Tarif sayfasi allergen guvenligi disclaimer.
 *
 * Tarif yazari `allergens` array'ini elle beyan ediyor (Mod A teslimi
 * sirasinda Codex doldurur, brief sec5.4 disiplinli). Ama her zaman
 * insanlik hatasi/eksik kalabilir. Bu helper:
 *
 *   - declared: tarifteki resmi `allergens` array
 *   - inferred: ingredient listelerinden `inferAllergensFromIngredients`
 *     ile cikarilan kume
 *
 * Iki kume diff'inde:
 *   - extraInferred: ingredient'ta var ama tarif beyani kapsamamis
 *     (orn. ingredient "yumurta" var ama YUMURTA tag'i unutulmus)
 *   - extraDeclared: tarif beyan etmis ama ingredient'lardan tespit
 *     edilemez (orn. "tahin" SUSAM degil ama beyan SUSAM = false-positive
 *     olabilir, veya cok nadir bir keyword inference'da yok)
 *
 * Tarif detay sayfasinda kullanici "?" disclaimer'ini gormesi icin:
 *   - extraInferred > 0: "Olasi extra allergen, dikkatli kullan"
 *   - extraDeclared > 0: "Tarif sahibi su allergen'i beyan etmis,
 *     malzeme listesinden tespit edemedik"
 *
 * Bu otomatik content moderation degil, kullanici icin transparency
 * notu. Allerji ciddi konudur, tek kaynaga (declared) guvenmemek
 * sorumlu UX.
 */
import type { Allergen } from "@prisma/client";
import { inferAllergensFromIngredients } from "@/lib/allergen-matching";

export interface AllergenConfidence {
  declared: Allergen[];
  inferred: Allergen[];
  extraInferred: Allergen[];
  extraDeclared: Allergen[];
  inSync: boolean;
}

export function computeAllergenConfidence(
  declared: readonly Allergen[],
  ingredients: readonly { name: string }[],
): AllergenConfidence {
  const inferred = inferAllergensFromIngredients(ingredients);
  const declaredSet = new Set<Allergen>(declared);
  const inferredSet = new Set<Allergen>(inferred);

  const extraInferred = inferred.filter((a) => !declaredSet.has(a));
  const extraDeclared = declared.filter((a) => !inferredSet.has(a));
  const inSync = extraInferred.length === 0 && extraDeclared.length === 0;

  return {
    declared: [...declared],
    inferred,
    extraInferred,
    extraDeclared,
    inSync,
  };
}
