import type { Difficulty, RecipeType } from "@prisma/client";

/**
 * Audience presets: one-click filter combinations for "Who am I cooking
 * for?" style shortcuts. Keep these few and opinionated; adding too many
 * dilutes the "fast path" UX goal.
 *
 * Two distinct shapes because the v3 (single-recipe) and v4 (weekly menu)
 * forms expose different filter surfaces:
 *   - Single: type + difficulty + maxMinutes + dietSlug
 *   - Menu: dietSlug + cuisines (+ optional per-meal maxMinutes)
 */

export interface SinglePresetValues {
  type?: RecipeType;
  difficulty?: Difficulty;
  maxMinutes?: number;
  dietSlug?: string;
}

export interface MenuPresetValues {
  dietSlug?: string;
  cuisines?: string[];
  maxBreakfastMinutes?: number;
  maxLunchMinutes?: number;
  maxDinnerMinutes?: number;
}

export interface SinglePreset {
  id: string;
  icon: string;
  /** i18n key suffix under aiPresets.single.{id} (label + description). */
  labelKey: string;
  values: SinglePresetValues;
}

export interface MenuPreset {
  id: string;
  icon: string;
  labelKey: string;
  values: MenuPresetValues;
}

export const SINGLE_PRESETS: readonly SinglePreset[] = [
  {
    id: "guest",
    icon: "👨‍👩‍👧",
    labelKey: "guest",
    values: { type: "YEMEK", difficulty: "MEDIUM", maxMinutes: 60 },
  },
  {
    id: "kids",
    icon: "🍼",
    labelKey: "kids",
    values: { type: "YEMEK", difficulty: "EASY", maxMinutes: 30 },
  },
  {
    id: "light",
    icon: "🌿",
    labelKey: "light",
    values: { dietSlug: "vejetaryen", maxMinutes: 30 },
  },
  {
    id: "quick",
    icon: "⚡",
    labelKey: "quick",
    values: { difficulty: "EASY", maxMinutes: 25 },
  },
  {
    id: "appetizer",
    icon: "🎉",
    labelKey: "appetizer",
    values: { type: "APERATIF", maxMinutes: 30 },
  },
  {
    id: "dessert",
    icon: "🍰",
    labelKey: "dessert",
    values: { type: "TATLI" },
  },
] as const;

export const MENU_PRESETS: readonly MenuPreset[] = [
  {
    id: "vegetarian",
    icon: "🌿",
    labelKey: "vegetarian",
    values: { dietSlug: "vejetaryen" },
  },
  {
    id: "vegan",
    icon: "🧡",
    labelKey: "vegan",
    values: { dietSlug: "vegan" },
  },
  {
    id: "glutenFree",
    icon: "🌾",
    labelKey: "glutenFree",
    values: { dietSlug: "glutensiz" },
  },
  {
    id: "mediterranean",
    icon: "🫒",
    labelKey: "mediterranean",
    values: { cuisines: ["tr", "gr", "it"] },
  },
  {
    id: "worldTour",
    icon: "🌎",
    labelKey: "worldTour",
    values: { cuisines: ["mx", "kr", "jp", "in", "th"] },
  },
  {
    id: "quickWeek",
    icon: "⚡",
    labelKey: "quickWeek",
    values: {
      maxBreakfastMinutes: 15,
      maxLunchMinutes: 25,
      maxDinnerMinutes: 30,
    },
  },
] as const;
