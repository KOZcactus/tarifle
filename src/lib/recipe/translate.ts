/**
 * Recipe.translations JSONB locale-aware content selector.
 *
 * Her tarifte Prisma `translations Json?` alanı var. Şeması:
 * {
 *   en?: {
 *     title?: string;
 *     description?: string;
 *     ingredients?: { sortOrder: number; name: string }[];
 *     steps?: { stepNumber: number; instruction: string; tip?: string }[];
 *     tipNote?: string;
 *     servingSuggestion?: string;
 *   };
 *   de?: { ... };
 *   ...
 * }
 *
 * Strateji: locale=tr için dokunma (primary dil). Diğer locale için
 * translations[locale].title varsa onu kullan, yoksa TR fallback.
 * Field-by-field fallback, EN title yokken description varsa yine
 * description'ı kullan, ama title TR kalır.
 *
 * Ingredient/step mapping: sortOrder/stepNumber ile eşlenir (array
 * index değil) → boş/eksik translation array'i TR'yi silmez.
 *
 * Bu pass'te Recipe.translations content 1103 tarifte null. EN user bile
 * TR content görecek. Retrofit pass'i translations JSONB'yi doldurunca
 * otomatik çalışır.
 */

import type { Locale } from "@/i18n/config";

interface IngredientLike {
  sortOrder: number;
  name: string;
}

interface StepLike {
  stepNumber: number;
  instruction: string;
  tip?: string | null;
}

interface RecipeLocaleBundle {
  title?: string;
  description?: string;
  ingredients?: { sortOrder: number; name: string }[];
  steps?: { stepNumber: number; instruction: string; tip?: string }[];
  tipNote?: string | null;
  servingSuggestion?: string | null;
}

/**
 * Translations alanı Prisma Json?, TypeScript tarafında `unknown`.
 * Helper'lar shape'i runtime'da narrow'lar (typeof check + field
 * existence), page tarafında JSON güvenliği garanti edilir.
 */
type TranslationsField = unknown;

function readLocaleBundle(
  translations: TranslationsField,
  locale: Locale,
): RecipeLocaleBundle | null {
  if (locale === "tr") return null;
  if (!translations || typeof translations !== "object") return null;
  const record = translations as Record<string, unknown>;
  const bundle = record[locale];
  if (!bundle || typeof bundle !== "object") return null;
  return bundle as RecipeLocaleBundle;
}

export function pickRecipeTitle(
  original: string,
  translations: TranslationsField,
  locale: Locale,
): string {
  const bundle = readLocaleBundle(translations, locale);
  return bundle?.title?.trim() || original;
}

export function pickRecipeDescription(
  original: string,
  translations: TranslationsField,
  locale: Locale,
): string {
  const bundle = readLocaleBundle(translations, locale);
  return bundle?.description?.trim() || original;
}

export function pickRecipeTipNote(
  original: string | null,
  translations: TranslationsField,
  locale: Locale,
): string | null {
  const bundle = readLocaleBundle(translations, locale);
  const translated = bundle?.tipNote?.trim();
  return translated ? translated : original;
}

export function pickRecipeServingSuggestion(
  original: string | null,
  translations: TranslationsField,
  locale: Locale,
): string | null {
  const bundle = readLocaleBundle(translations, locale);
  const translated = bundle?.servingSuggestion?.trim();
  return translated ? translated : original;
}

export function mapTranslatedIngredients<T extends IngredientLike>(
  ingredients: T[],
  translations: TranslationsField,
  locale: Locale,
): T[] {
  const bundle = readLocaleBundle(translations, locale);
  if (!bundle?.ingredients || bundle.ingredients.length === 0) {
    return ingredients;
  }
  const byOrder = new Map(
    bundle.ingredients.map((item) => [item.sortOrder, item]),
  );
  return ingredients.map((ing) => {
    const translated = byOrder.get(ing.sortOrder);
    if (translated?.name?.trim()) {
      return { ...ing, name: translated.name.trim() };
    }
    return ing;
  });
}

/**
 * Check if a recipe has a FULL Mod B translation for a given locale.
 * "Full" = ingredients + steps arrays present and non-empty in the
 * locale bundle (Mod A sadece title+description yazıyordu, Mod B
 * ingredients+steps+tipNote+servingSuggestion tümünü dolduruyor).
 *
 * Used by recipe detail page to show a "Full translation" badge for
 * EN/DE readers, trust signal that the recipe isn't a thin auto-translated
 * card. tr locale için her zaman false (source language).
 */
export function hasFullTranslation(
  translations: TranslationsField,
  locale: Locale,
): boolean {
  const bundle = readLocaleBundle(translations, locale);
  if (!bundle) return false;
  const ing = (bundle as { ingredients?: unknown }).ingredients;
  const steps = (bundle as { steps?: unknown }).steps;
  return (
    Array.isArray(ing) &&
    ing.length > 0 &&
    Array.isArray(steps) &&
    steps.length > 0
  );
}

export function mapTranslatedSteps<T extends StepLike>(
  steps: T[],
  translations: TranslationsField,
  locale: Locale,
): T[] {
  const bundle = readLocaleBundle(translations, locale);
  if (!bundle?.steps || bundle.steps.length === 0) {
    return steps;
  }
  const byNumber = new Map(
    bundle.steps.map((item) => [item.stepNumber, item]),
  );
  return steps.map((step) => {
    const translated = byNumber.get(step.stepNumber);
    if (!translated) return step;
    const next: T = { ...step };
    if (translated.instruction?.trim()) {
      next.instruction = translated.instruction.trim();
    }
    if (translated.tip?.trim()) {
      next.tip = translated.tip.trim();
    }
    return next;
  });
}
