/**
 * Natural-language commentary generation for suggestions. Designed to feel
 * conversational and varied so the rule-based provider reads like a real
 * assistant rather than a template.
 *
 * Variation strategy: for each scenario we keep multiple phrasings and pick
 * one pseudo-randomly based on a stable seed (user ingredients), so repeated
 * requests with the same input don't flip wording but different requests feel
 * fresh.
 *
 * Locale handling: all text comes from `messages/{locale}.json` under the
 * `aiCommentary` namespace. Variant arrays are read with `t.raw(key)`. The
 * caller (rule-based-provider) resolves locale via `getLocale()` and passes
 * it in, if omitted we fall back to TR (site default).
 */
import { getTranslations } from "next-intl/server";
import type { AiSuggestion } from "./types";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { isPantryStaple } from "./matcher";

/**
 * A user with 15+ real ingredients has a well-stocked pantry, the tone
 * shifts from "best-fit matching" to "you have plenty of options". The
 * threshold is deliberately permissive; the real purpose is to light up
 * the "packed pantry" variants for power users.
 */
const MANY_INGREDIENTS_THRESHOLD = 15;

type Tns = Awaited<ReturnType<typeof getTranslations<"aiCommentary">>>;

function pick<T>(options: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

/**
 * Lowercase the first character of `body` for the given locale. Preserves the
 * English first-person pronoun "I " and "I'" (contractions like "I'll",
 * "I've") since it stays capital mid-sentence. Uses `toLocaleLowerCase` so
 * Turkish `İ` becomes `i` rather than the dotted-`i̇` default.
 */
export function lowercaseFirstLetterForLocale(body: string, locale: Locale): string {
  if (body.length === 0) return body;
  const first = body[0];
  const next = body[1] ?? "";
  if (locale === "en" && first === "I" && (next === "" || next === " " || next === "'")) {
    return body;
  }
  return first.toLocaleLowerCase(locale) + body.slice(1);
}

/**
 * Apply the cuisine/filter prefix `ctx` to a template body. Every variant gets
 * the same prefix regardless of whether its source string uses `{ctx}`, this
 * keeps cuisine/filter context visible even when `pick()` selects a variant
 * the author didn't prefix. When `ctx` is empty, the body is returned as-is.
 *
 * When `ctx` is non-empty, the first letter of the body is lowercased (with
 * the EN "I" pronoun exception) so the result reads as a natural mid-sentence
 * continuation: "From Turkish cuisine, you can make…" not "…, You can make…".
 */
export function applyCtx(template: string, ctx: string, locale: Locale): string {
  const body = template.startsWith("{ctx}") ? template.slice("{ctx}".length) : template;
  if (!ctx) return body;
  return ctx + lowercaseFirstLetterForLocale(body, locale);
}

function formatList(items: string[], t: Tns, max = 2): string {
  const trimmed = items.slice(0, max);
  if (items.length <= max) {
    if (trimmed.length === 1) return trimmed[0];
    if (trimmed.length === 2) return t("listAnd", { a: trimmed[0], b: trimmed[1] });
  }
  return t("listMore", { items: trimmed.join(", "), count: items.length - max });
}

/** Active filter context for commentary. */
export interface CommentaryContext {
  cuisines?: string[];
  type?: string;
  difficulty?: string;
  maxMinutes?: number;
}

function filterSuffix(ctx: CommentaryContext | undefined, t: Tns): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.type) {
    const label = t.raw(`typeLabels.${ctx.type}`);
    if (typeof label === "string") {
      parts.push(t("filterInType", { label }));
    }
  }
  if (ctx.maxMinutes) {
    parts.push(t("filterMaxMinutes", { n: ctx.maxMinutes }));
  }
  if (ctx.difficulty) {
    const label = t.raw(`difficultyLabels.${ctx.difficulty}`);
    if (typeof label === "string") {
      parts.push(t("filterDifficulty", { label }));
    }
  }
  if (parts.length === 0) return "";
  return parts.join(", ") + " ";
}

/**
 * Resolve cuisine labels for commentary prefix. Commentary has its own
 * namespace but cuisine names live under `cuisines.*`, so we build the
 * prefix string here with a second getTranslations call.
 */
async function resolveCuisinePrefix(
  cuisines: string[] | undefined,
  locale: Locale,
): Promise<string> {
  if (!cuisines || cuisines.length === 0) return "";
  const tCuisine = await getTranslations({ locale, namespace: "cuisines" });
  const t = await getTranslations({ locale, namespace: "aiCommentary" });
  const labels = cuisines
    .map((c) => (tCuisine.has(c) ? tCuisine(c) : null))
    .filter((l): l is string => Boolean(l));
  if (labels.length === 0) return "";
  if (labels.length === 1) return t("cuisineSingle", { label: labels[0] });
  if (labels.length === 2)
    return t("cuisineDouble", { label1: labels[0], label2: labels[1] });
  return t("cuisineMulti", {
    first: labels.slice(0, 2).join(", "),
    count: labels.length - 2,
  });
}

export async function buildOverallCommentary(
  userIngredients: string[],
  results: AiSuggestion[],
  cuisines?: string[],
  context?: CommentaryContext,
  locale: Locale = DEFAULT_LOCALE,
): Promise<string> {
  const t = await getTranslations({ locale, namespace: "aiCommentary" });
  const seed = userIngredients.join("|").toLocaleLowerCase(locale);
  const cp = await resolveCuisinePrefix(cuisines, locale);
  const fs = filterSuffix(context, t);
  // Combined context: "Türk mutfağından çorba kategorisinde " or just ""
  const ctx = cp || fs ? `${cp}${fs}`.trim() + " " : "";

  const rawVariant = (key: string): string[] => {
    const raw = t.raw(key);
    return Array.isArray(raw) ? (raw as string[]) : [];
  };

  // Classify the user's ingredient input BEFORE dispatching on results,
  // pantry-only / single / many variants speak to the input size itself
  // and trump the per-result-count templates below.
  const realIngredients = userIngredients.filter((ing) => !isPantryStaple(ing));
  const onlyPantry = userIngredients.length > 0 && realIngredients.length === 0;
  const isSingle = realIngredients.length === 1;
  const isMany = realIngredients.length >= MANY_INGREDIENTS_THRESHOLD;

  if (onlyPantry) {
    const template = pick(rawVariant("pantryOnly"), seed);
    return applyCtx(template, ctx, locale);
  }

  if (results.length === 0) {
    const template = pick(rawVariant("empty"), seed);
    return applyCtx(template, ctx, locale).replace(
      "{count}",
      String(userIngredients.length),
    );
  }

  const perfect = results.filter((r) => r.missingIngredients.length === 0);
  const closeCall = results.filter(
    (r) => r.missingIngredients.length > 0 && r.missingIngredients.length <= 2,
  );
  const top = results[0];

  if (isMany) {
    const template = pick(rawVariant("manyIngredients"), seed);
    return applyCtx(template, ctx, locale)
      .replace("{count}", String(results.length))
      .replace("{title}", top.title);
  }

  if (isSingle) {
    const template = pick(rawVariant("singleIngredient"), seed);
    return applyCtx(template, ctx, locale)
      .replace("{ingredient}", realIngredients[0])
      .replace("{title}", top.title);
  }

  if (perfect.length >= 3) {
    const template = pick(rawVariant("perfectMany"), seed);
    return applyCtx(template, ctx, locale).replace("{count}", String(perfect.length));
  }

  if (perfect.length === 2) {
    const template = pick(rawVariant("perfect2"), seed);
    return applyCtx(template, ctx, locale)
      .replace("{title1}", perfect[0].title)
      .replace("{title2}", perfect[1].title);
  }

  if (perfect.length === 1) {
    const template = pick(rawVariant("perfect1"), seed);
    return applyCtx(template, ctx, locale).replace("{title}", perfect[0].title);
  }

  if (closeCall.length > 0) {
    const missing = formatList(top.missingIngredients, t);
    const template = pick(rawVariant("closeCall"), seed);
    return applyCtx(template, ctx, locale)
      .replace("{title}", top.title)
      .replace("{missing}", missing);
  }

  const template = pick(rawVariant("fallback"), seed);
  return applyCtx(template, ctx, locale).replace("{title}", top.title);
}

/**
 * Per-recipe short note. We assign roles based on position and stats so each
 * card has a personality: the best match, the fastest, the ambitious one, etc.
 */
export async function assignRecipeNotes(
  results: AiSuggestion[],
  locale: Locale = DEFAULT_LOCALE,
): Promise<AiSuggestion[]> {
  if (results.length === 0) return results;

  const t = await getTranslations({ locale, namespace: "aiCommentary" });
  const rawVariant = (key: string): string[] => {
    const raw = t.raw(key);
    return Array.isArray(raw) ? (raw as string[]) : [];
  };

  // Find reference points
  const fastestIndex = results.reduce(
    (best, r, i) => (r.totalMinutes < results[best].totalMinutes ? i : best),
    0,
  );
  const longestIndex = results.reduce(
    (best, r, i) => (r.totalMinutes > results[best].totalMinutes ? i : best),
    0,
  );

  return results.map((s, i) => {
    const perfect = s.missingIngredients.length === 0;
    const oneMissing = s.missingIngredients.length === 1;
    const twoMissing = s.missingIngredients.length === 2;

    // Highest priority first, first matching rule wins
    let note = "";

    if (i === 0 && perfect) {
      note = pick(rawVariant("notesFirstPerfect"), s.recipeId);
    } else if (i === 0 && oneMissing) {
      const template = pick(rawVariant("notesFirstOneMissing"), s.recipeId);
      note = template.replace("{missing}", s.missingIngredients[0]);
    } else if (i === fastestIndex && s.totalMinutes <= 20) {
      const template = pick(rawVariant("notesFastest"), s.recipeId);
      note = template.replace("{minutes}", String(s.totalMinutes));
    } else if (perfect) {
      note = pick(rawVariant("notesPerfectAlt"), s.recipeId);
    } else if (oneMissing) {
      note = t("notesOneMissing", { missing: s.missingIngredients[0] });
    } else if (twoMissing) {
      note = t("notesTwoMissing", {
        missing1: s.missingIngredients[0],
        missing2: s.missingIngredients[1],
      });
    } else if (s.difficulty === "HARD" && i < 3) {
      note = pick(rawVariant("notesHard"), s.recipeId);
    } else if (i === longestIndex && s.totalMinutes >= 60) {
      note = t("notesLongest");
    }

    return { ...s, note };
  });
}

