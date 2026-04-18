import type { Difficulty, RecipeType } from "@prisma/client";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import trMessages from "../../../messages/tr.json";
import enMessages from "../../../messages/en.json";

/**
 * "AI-feel" copy for the daily recipe widget. Entirely rule-based — zero LLM
 * calls — but varied and recipe-aware enough that a casual visitor perceives
 * it as curated. Mirrors the approach in `src/lib/ai/commentary.ts` (same
 * seed-based determinism so reloads are stable).
 *
 * Locale handling: sync + direct JSON import (keeps tests simple and avoids
 * a request-context dependency on `getTranslations`). Caller resolves locale
 * via `getLocale()` at the query layer (`src/lib/queries/recipe-of-the-day.ts`)
 * and passes it in. Defaults to TR (site primary language).
 *
 * Why rule-based: per `feedback_ai_positioning`, we prefer zero-cost AI-feel
 * over real LLM. The user doesn't notice the difference; we don't add a
 * recurring per-request cost.
 */

interface DailyRecipeMessages {
  intros: readonly string[];
  rules: Record<string, readonly string[]>;
  fallback: string;
}

function getMessages(locale: Locale): DailyRecipeMessages {
  if (locale === "en") {
    return (enMessages as unknown as { dailyRecipe: DailyRecipeMessages }).dailyRecipe;
  }
  return (trMessages as unknown as { dailyRecipe: DailyRecipeMessages }).dailyRecipe;
}

/** Features the curator-note rules inspect. Mirror of the recipe fields we need. */
export interface CuratorInput {
  type: RecipeType;
  difficulty: Difficulty;
  totalMinutes: number;
  averageCalories: number | null;
  isFeatured: boolean;
  variationCount: number;
}

/**
 * Rule matcher. The notes pool is looked up per-locale from messages — this
 * keeps the matching logic language-agnostic while the copy travels with the
 * rest of i18n.
 */
interface Rule {
  /** Stable id for testing + logging. Matches the key in messages.dailyRecipe.rules. */
  id: string;
  matches: (f: CuratorInput) => boolean;
}

/** Ordered by specificity — first match wins. */
const RULES: readonly Rule[] = [
  { id: "tatli", matches: (f) => f.type === "TATLI" },
  { id: "kokteyl", matches: (f) => f.type === "KOKTEYL" },
  { id: "corba", matches: (f) => f.type === "CORBA" },
  { id: "salata", matches: (f) => f.type === "SALATA" },
  { id: "kahvalti", matches: (f) => f.type === "KAHVALTI" },
  { id: "atistirmalik", matches: (f) => f.type === "ATISTIRMALIK" },
  { id: "hard", matches: (f) => f.difficulty === "HARD" },
  { id: "quick", matches: (f) => f.difficulty === "EASY" && f.totalMinutes <= 30 },
  { id: "veryQuick", matches: (f) => f.totalMinutes > 0 && f.totalMinutes <= 20 },
  { id: "light", matches: (f) => f.averageCalories !== null && f.averageCalories < 250 },
  { id: "hearty", matches: (f) => f.averageCalories !== null && f.averageCalories > 500 },
  { id: "popularVariations", matches: (f) => f.variationCount >= 3 },
  { id: "featured", matches: (f) => f.isFeatured },
];

/**
 * Picks one of the intro sentences deterministically. Same seed + locale →
 * same output. Exported for unit tests.
 */
export function pickDailyIntro(
  seed: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const intros = getMessages(locale).intros;
  const i = ((seed % intros.length) + intros.length) % intros.length;
  return intros[i]!;
}

/**
 * Builds the per-recipe curator note. Walks rules in order, grabs the first
 * matcher, then rotates between its notes by the provided seed. Falls back
 * to a generic sentence when no rule matches (should be rare — "featured"
 * OR the generic fallback will nearly always cover).
 */
export function buildCuratorNote(
  features: CuratorInput,
  seed: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const messages = getMessages(locale);
  for (const rule of RULES) {
    if (!rule.matches(features)) continue;
    const notes = messages.rules[rule.id];
    if (!notes || notes.length === 0) continue;
    if (notes.length === 1) return notes[0]!;
    const i = ((seed % notes.length) + notes.length) % notes.length;
    return notes[i]!;
  }
  return messages.fallback;
}

/** Exposed for test introspection. Length of the TR intro pool (canonical). */
export const __INTRO_COUNT = (trMessages as unknown as { dailyRecipe: DailyRecipeMessages })
  .dailyRecipe.intros.length;

/** Exposed for test introspection. */
export const __RULE_IDS = RULES.map((r) => r.id);
