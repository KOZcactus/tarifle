/**
 * AI Asistan v4: rule-based weekly menu planner.
 *
 * Plans a 7-day × 3-meal grid (21 slots) by reusing the v3 pantry
 * matcher + diet/cuisine filters and then applying slot-type constraints
 * (breakfast = KAHVALTI, lunch = SALATA|CORBA|YEMEK, dinner = YEMEK).
 *
 * Diversification rules:
 *   - a single recipe never repeats in the same week,
 *   - no more than 2 recipes from the same category across 7 dinners,
 *   - no more than 3 recipes from the same cuisine across the week,
 *   - breakfast pool fills from quick (<= maxBreakfastMinutes) recipes only.
 *
 * The algorithm is deterministic when `seed` is provided (fixtures can
 * reproduce the same grid for tests), otherwise it falls back to
 * insertion order produced by the v3 scoring tie-breaker.
 */
import type { RecipeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeMatch, recipeContainsExcluded } from "./matcher";
import { dietConfigBySlug } from "@/lib/diets";
import type {
  AiMenuPlanner,
  AiSuggestion,
  MenuSlot,
  WeeklyMenuInput,
  WeeklyMenuResponse,
} from "./types";

const MIN_SCORE = 0.3;
const BREAKFAST_TYPES: RecipeType[] = ["KAHVALTI"];
const LUNCH_TYPES: RecipeType[] = ["SALATA", "CORBA", "YEMEK"];
const DINNER_TYPES: RecipeType[] = ["YEMEK"];
const DEFAULT_MAX_BREAKFAST = 25;
const DEFAULT_MAX_LUNCH = 45;
const DEFAULT_MAX_DINNER = 60;
const MAX_PER_CATEGORY_WEEK = 2;
const MAX_PER_CUISINE_WEEK = 3;

type MealSlotType = MenuSlot["mealType"];

interface ScoredRecipe extends AiSuggestion {
  _totalMinutes: number;
  _type: RecipeType;
}

/**
 * Small seedable PRNG (mulberry32). Deterministic with string seed,
 * used to break ties when many recipes share the same match score and
 * we still want variety from day to day.
 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pulls and scores candidate recipes for a single meal type + filters.
 * Returns the list sorted by matchScore descending with tie-break on
 * totalMinutes ascending.
 */
async function fetchCandidates(
  input: WeeklyMenuInput,
  types: RecipeType[],
  maxMinutes: number,
): Promise<ScoredRecipe[]> {
  const dietCfg = input.dietSlug ? dietConfigBySlug(input.dietSlug) : null;

  const recipes = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      type: { in: types },
      totalMinutes: { lte: maxMinutes },
      ...(input.cuisines && input.cuisines.length > 0
        ? { cuisine: { in: input.cuisines } }
        : {}),
      ...(dietCfg?.tagSlug
        ? { tags: { some: { tag: { slug: dietCfg.tagSlug } } } }
        : {}),
      ...(dietCfg?.excludeAllergen
        ? {
            NOT: {
              allergens: {
                hasSome: [dietCfg.excludeAllergen as never],
              },
            },
          }
        : {}),
    },
    include: {
      ingredients: true,
      category: { select: { name: true } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
    orderBy: { slug: "asc" },
  });

  const excludeList = input.excludeIngredients ?? [];

  const scored: ScoredRecipe[] = recipes
    .map((recipe) => {
      const match = computeMatch(
        recipe.ingredients.map((i) => ({
          name: i.name,
          isOptional: i.isOptional,
        })),
        input.ingredients,
        { assumePantryStaples: input.assumePantryStaples },
      );
      return {
        recipeId: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        emoji: recipe.emoji,
        imageUrl: recipe.imageUrl,
        categoryName: recipe.category.name,
        cuisine: recipe.cuisine,
        difficulty: recipe.difficulty,
        totalMinutes: recipe.totalMinutes,
        servingCount: recipe.servingCount,
        averageCalories: recipe.averageCalories,
        hungerBar: recipe.hungerBar,
        matchScore: match.score,
        matchedIngredients: match.matched,
        missingIngredients: match.missing,
        tags: recipe.tags.map((t) => t.tag.slug),
        _totalMinutes: recipe.totalMinutes,
        _type: recipe.type,
        _ingredients: recipe.ingredients,
      } as ScoredRecipe & { _ingredients: typeof recipe.ingredients };
    })
    .filter((s) =>
      excludeList.length === 0
        ? true
        : !recipeContainsExcluded(
            (s as ScoredRecipe & { _ingredients: { name: string }[] })
              ._ingredients,
            excludeList,
          ),
    )
    .filter((s) => s.matchScore >= MIN_SCORE)
    .map((s) => {
      const { _ingredients, ...rest } = s as ScoredRecipe & {
        _ingredients: unknown;
      };
      void _ingredients;
      return rest;
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a._totalMinutes - b._totalMinutes;
    });

  return scored;
}

/**
 * Picks the best recipe for a given slot subject to week-level
 * diversification caps. Returns null if no candidate satisfies caps.
 */
function pickForSlot(
  candidates: ScoredRecipe[],
  usedSlugs: Set<string>,
  categoryCount: Map<string, number>,
  cuisineCount: Map<string, number>,
  maxPerCategory: number,
  maxPerCuisine: number,
  rand: () => number,
): ScoredRecipe | null {
  // Among top N candidates that pass caps, pick one with slight
  // randomness (seeded) to avoid always choosing the head.
  const pool: ScoredRecipe[] = [];
  for (const c of candidates) {
    if (usedSlugs.has(c.slug)) continue;
    if ((categoryCount.get(c.categoryName) ?? 0) >= maxPerCategory) continue;
    if (c.cuisine && (cuisineCount.get(c.cuisine) ?? 0) >= maxPerCuisine) continue;
    pool.push(c);
    if (pool.length >= 5) break; // small pool keeps top-relevance
  }
  if (pool.length === 0) return null;
  const idx = Math.floor(rand() * pool.length);
  return pool[idx] ?? pool[0] ?? null;
}

function buildReason(
  slotType: MealSlotType,
  recipe: ScoredRecipe,
): string {
  const missing = recipe.missingIngredients.length;
  if (missing === 0) return "Tüm malzemeler elinizde";
  if (missing === 1) return `Tek eksik: ${recipe.missingIngredients[0]}`;
  if (missing === 2)
    return `Eksik 2 malzeme: ${recipe.missingIngredients.slice(0, 2).join(", ")}`;
  const slotHint =
    slotType === "BREAKFAST"
      ? "Hızlı kahvaltı"
      : slotType === "LUNCH"
        ? "Öğlen ideal"
        : "Akşam tok";
  return `${slotHint}, ${missing} eksik malzeme`;
}

export class RuleBasedMenuPlanner implements AiMenuPlanner {
  readonly name = "rule-based" as const;

  async plan(input: WeeklyMenuInput): Promise<WeeklyMenuResponse> {
    const maxB = input.maxBreakfastMinutes ?? DEFAULT_MAX_BREAKFAST;
    const maxL = input.maxLunchMinutes ?? DEFAULT_MAX_LUNCH;
    const maxD = input.maxDinnerMinutes ?? DEFAULT_MAX_DINNER;

    const [breakfast, lunch, dinner] = await Promise.all([
      fetchCandidates(input, BREAKFAST_TYPES, maxB),
      fetchCandidates(input, LUNCH_TYPES, maxL),
      fetchCandidates(input, DINNER_TYPES, maxD),
    ]);

    const seed = input.seed ? hashString(input.seed) : Date.now();
    const rand = mulberry32(seed);

    const usedSlugs = new Set<string>();
    const categoryCount = new Map<string, number>();
    const cuisineCount = new Map<string, number>();

    const slots: MenuSlot[] = [];
    let unfilled = 0;

    for (let day = 0; day < 7; day++) {
      const slotsForDay: Array<{ type: MealSlotType; pool: ScoredRecipe[] }> = [
        { type: "BREAKFAST", pool: breakfast },
        { type: "LUNCH", pool: lunch },
        { type: "DINNER", pool: dinner },
      ];
      for (const { type, pool } of slotsForDay) {
        const pick = pickForSlot(
          pool,
          usedSlugs,
          categoryCount,
          cuisineCount,
          MAX_PER_CATEGORY_WEEK,
          MAX_PER_CUISINE_WEEK,
          rand,
        );
        if (pick) {
          usedSlugs.add(pick.slug);
          categoryCount.set(
            pick.categoryName,
            (categoryCount.get(pick.categoryName) ?? 0) + 1,
          );
          if (pick.cuisine)
            cuisineCount.set(
              pick.cuisine,
              (cuisineCount.get(pick.cuisine) ?? 0) + 1,
            );
          const { _totalMinutes, _type, ...suggestion } = pick;
          void _totalMinutes;
          void _type;
          slots.push({
            dayOfWeek: day,
            mealType: type,
            recipe: suggestion,
            reason: buildReason(type, pick),
          });
        } else {
          slots.push({ dayOfWeek: day, mealType: type, recipe: null });
          unfilled++;
        }
      }
    }

    const filledCount = 21 - unfilled;
    const cuisineTotal = cuisineCount.size;
    const categoryTotal = categoryCount.size;
    const commentary =
      unfilled > 0
        ? `Haftalık menüde ${filledCount}/21 slot dolduruldu, ${unfilled} slot için mevcut malzeme ve filtrelerle uygun tarif bulunamadı. Pantry'yi genişletmeyi veya diyet filtresini gevşetmeyi deneyin.`
        : `Haftalık menü tamam. ${cuisineTotal} farklı mutfak, ${categoryTotal} kategori, 21 farklı tarif.`;

    return {
      slots,
      commentary,
      unfilledCount: unfilled,
      provider: "rule-based",
    };
  }
}

export function getMenuPlanner(): AiMenuPlanner {
  return new RuleBasedMenuPlanner();
}
