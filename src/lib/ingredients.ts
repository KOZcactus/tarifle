/**
 * Shared types + helpers for recipe/variation ingredients.
 *
 * History: early seeds and the first variation form stored ingredients as a
 * plain `string[]`, each item a raw line like "2 yemek kaşığı un". The new
 * variation form asks for amount + unit + name as separate fields so the
 * data is structured and we can later do things like scale servings, build
 * shopping lists without NLP, or offer better auto-complete.
 *
 * To keep the schema one JSON column and avoid a bulk migration, callers
 * `normaliseIngredients(raw)` a Variation.ingredients payload into a canonical
 * `Ingredient[]`. Old string rows show up with `amount`/`unit` empty and the
 * entire original line in `name`, which still renders correctly.
 */

export interface Ingredient {
  amount: string;
  unit: string;
  name: string;
}

/** Canonical Turkish kitchen units for the dropdown, ordered by real usage. */
export const INGREDIENT_UNITS = [
  "",
  "adet",
  "gr",
  "kg",
  "ml",
  "l",
  "su bardağı",
  "çay bardağı",
  "fincan",
  "yemek kaşığı",
  "tatlı kaşığı",
  "çay kaşığı",
  "diş",
  "demet",
  "yaprak",
  "dilim",
  "tutam",
  "paket",
  "kutu",
  "şişe",
  "kase",
  "avuç",
  "dal",
  "tane",
] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

/** Small guard so legacy `string[]` rows still render without crashing. */
export function isStructuredIngredient(value: unknown): value is Ingredient {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name: unknown }).name === "string"
  );
}

/**
 * Accepts anything Prisma's `Json` column can hold and produces a clean
 * `Ingredient[]`. Silently drops malformed entries, the admin review path
 * would have filtered junk before it got here.
 */
export function normaliseIngredients(raw: unknown): Ingredient[] {
  if (!Array.isArray(raw)) return [];
  const out: Ingredient[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) {
        out.push({ amount: "", unit: "", name: trimmed });
      }
    } else if (isStructuredIngredient(item)) {
      const amount =
        typeof (item as { amount?: unknown }).amount === "string"
          ? (item as { amount: string }).amount.trim()
          : "";
      const unit =
        typeof (item as { unit?: unknown }).unit === "string"
          ? (item as { unit: string }).unit.trim()
          : "";
      const name = item.name.trim();
      if (name) out.push({ amount, unit, name });
    }
  }
  return out;
}

/**
 * Join an ingredient back into a single presentation string.
 * Examples:
 *   { amount: "2", unit: "yemek kaşığı", name: "un" } -> "2 yemek kaşığı un"
 *   { amount: "",  unit: "",             name: "tuz" } -> "tuz"
 *   { amount: "1", unit: "",             name: "soğan" } -> "1 soğan"
 */
export function formatIngredient(item: Ingredient): string {
  const parts = [item.amount, item.unit, item.name]
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.join(" ");
}
