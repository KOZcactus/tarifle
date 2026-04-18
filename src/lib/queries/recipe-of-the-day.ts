import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Difficulty, RecipeType } from "@prisma/client";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";
import {
  buildCuratorNote,
  pickDailyIntro,
} from "@/lib/ai/recipe-of-the-day-commentary";

/**
 * Result shape served to the homepage widget. Mirrors RecipeCard but adds
 * `type` (used by the curator-note rules) and bundles the rule-based
 * intro/note so the server component stays render-only.
 */
export interface RecipeOfTheDay {
  recipe: {
    id: string;
    title: string;
    slug: string;
    emoji: string | null;
    type: RecipeType;
    difficulty: Difficulty;
    totalMinutes: number;
    servingCount: number;
    averageCalories: number | null;
    description: string;
    imageUrl: string | null;
    isFeatured: boolean;
    category: {
      name: string;
      slug: string;
      emoji: string | null;
    };
    _count: { variations: number };
  };
  intro: string;
  curatorNote: string;
  seed: number;
}

/**
 * Number of whole days since the Unix epoch (UTC). Used as the rotation seed
 * so every visitor on the same calendar day sees the same pick — which means
 * the homepage response is cacheable across users without freshness drift
 * within a day.
 *
 * Pure function; callers pass `now` explicitly to make it test-friendly.
 */
export function daysSinceEpoch(now: Date = new Date()): number {
  return Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
}

/**
 * Deterministically picks a recipe for "today". Strategy:
 *   1. Load every PUBLISHED recipe's id ordered by `slug` (stable across
 *      inserts of unrelated recipes — alphabetical is cheaper than hashing).
 *   2. seed = daysSinceEpoch(now); index = seed mod count.
 *   3. Fetch the full card data for that one id.
 *
 * Rationale for ORDER BY slug: createdAt drifts when new recipes are seeded
 * (Codex batch), which would shuffle the rotation mid-cycle. Slug order is
 * stable — a new recipe only shifts entries that come after it in the
 * alphabet and only does so after the next day index lands on those slots.
 *
 * Returns null when there are zero PUBLISHED recipes so the caller can
 * gracefully skip rendering.
 */
export async function getRecipeOfTheDay(
  now: Date = new Date(),
): Promise<RecipeOfTheDay | null> {
  const ids = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true },
    orderBy: { slug: "asc" },
  });
  if (ids.length === 0) return null;

  const seed = daysSinceEpoch(now);
  const index = ((seed % ids.length) + ids.length) % ids.length; // handles negatives
  const targetId = ids[index]!.id;

  const recipe = await prisma.recipe.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      title: true,
      slug: true,
      emoji: true,
      type: true,
      difficulty: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      description: true,
      imageUrl: true,
      isFeatured: true,
      category: {
        select: { name: true, slug: true, emoji: true },
      },
      _count: {
        select: { variations: { where: { status: "PUBLISHED" } } },
      },
    },
  });
  if (!recipe) return null;

  const rawLocale = await getLocale();
  const locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return {
    recipe,
    intro: pickDailyIntro(seed, locale),
    curatorNote: buildCuratorNote(
      {
        type: recipe.type,
        difficulty: recipe.difficulty,
        totalMinutes: recipe.totalMinutes,
        averageCalories: recipe.averageCalories,
        isFeatured: recipe.isFeatured,
        variationCount: recipe._count.variations,
      },
      seed,
      locale,
    ),
    seed,
  };
}
