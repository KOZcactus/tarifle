/**
 * Shared recipe builder helpers (oturum 32 IIFE format homojenleştirme).
 *
 * Önceki yapı: scripts/seed-recipes.ts içinde 63 IIFE bloğu, her biri kendi
 * local helper'larını (t, ing, st, r) tanımlıyordu. 213 duplicate helper
 * definition. Bu modül helper'ları tek kaynağa taşır, IIFE'ler global
 * import üzerinden çağırır.
 *
 * Format kuralları:
 *   - ing(): string-pipe ingredient ["Name|amount|unit"] → object array
 *   - st(): string-pipe step ["instruction||timer"] → object array
 *   - t(): translations TR/EN/DE quad
 *   - r(): full recipe shorthand → SeedRecipe
 *
 * Plain {} format tarifler (eski kayıtlar) helper kullanmadan obj array
 * yazılır, hâlâ uyumlu (helper opsiyonel sugar).
 */
import type { SeedRecipe } from "../../src/lib/seed/recipe-schema";

export type Translations = {
  en: { title: string; description: string };
  de: { title: string; description: string };
};

export const t = (
  enTitle: string,
  enDescription: string,
  deTitle: string,
  deDescription: string,
): Translations => ({
  en: { title: enTitle, description: enDescription },
  de: { title: deTitle, description: deDescription },
});

export interface IngredientShorthand {
  name: string;
  amount: string;
  unit: string;
  sortOrder: number;
}

export const ing = (specs: string[]): IngredientShorthand[] =>
  specs.map((s, i) => {
    const [name, amount, unit] = s.split("|");
    return { name, amount, unit, sortOrder: i + 1 };
  });

export interface StepShorthand {
  stepNumber: number;
  instruction: string;
  timerSeconds?: number;
}

export const st = (specs: string[]): StepShorthand[] =>
  specs.map((s, i) => {
    const [instruction, timer] = s.split("||");
    return timer
      ? { stepNumber: i + 1, instruction, timerSeconds: Number(timer) }
      : { stepNumber: i + 1, instruction };
  });

type RecipeShorthand = Omit<SeedRecipe, "ingredients" | "steps"> & {
  ingredients: string[];
  steps: string[];
};

export const r = (o: RecipeShorthand): SeedRecipe => ({
  ...o,
  ingredients: ing(o.ingredients),
  steps: st(o.steps),
});
