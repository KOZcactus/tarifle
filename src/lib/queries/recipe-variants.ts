import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface RecipeVariant {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  imageUrl: string | null;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  stepCount: number;
  ingredientCount: number;
  isFeatured: boolean;
}

interface VariantResult {
  simpler: RecipeVariant | null;
  fancier: RecipeVariant | null;
}

/**
 * Finds a "simpler" and "fancier" recipe related to the given slug.
 *
 *   - simpler: same category + type, fewer steps and ingredients
 *   - fancier: same category + type, more steps / more ingredients
 *     (or isFeatured if no tangibly more-complex sibling exists)
 *
 * Rule-based, zero LLM cost. 30 minute cache.
 */
async function computeVariantsInner(
  slug: string,
): Promise<VariantResult> {
  const anchor = await prisma.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      categoryId: true,
      type: true,
      status: true,
      _count: { select: { steps: true, ingredients: true } },
    },
  });
  if (!anchor || anchor.status !== "PUBLISHED") {
    return { simpler: null, fancier: null };
  }

  const pool = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: anchor.id },
      categoryId: anchor.categoryId,
      type: anchor.type,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      emoji: true,
      imageUrl: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      isFeatured: true,
      _count: { select: { steps: true, ingredients: true } },
    },
    take: 80,
  });

  const anchorSteps = anchor._count.steps;
  const anchorIngs = anchor._count.ingredients;

  const simplerPick = pool
    .filter(
      (r) =>
        r._count.steps < anchorSteps || r._count.ingredients < anchorIngs,
    )
    .sort((a, b) => {
      const aComplexity = a._count.steps + a._count.ingredients;
      const bComplexity = b._count.steps + b._count.ingredients;
      return aComplexity - bComplexity;
    })[0];

  const fancierPick = pool
    .filter(
      (r) =>
        r._count.steps > anchorSteps ||
        r._count.ingredients > anchorIngs ||
        r.isFeatured,
    )
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      const aComplexity = a._count.steps + a._count.ingredients;
      const bComplexity = b._count.steps + b._count.ingredients;
      return bComplexity - aComplexity;
    })[0];

  const toVariant = (r: (typeof pool)[number]): RecipeVariant => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    emoji: r.emoji,
    imageUrl: r.imageUrl,
    totalMinutes: r.totalMinutes,
    servingCount: r.servingCount,
    averageCalories: r.averageCalories,
    stepCount: r._count.steps,
    ingredientCount: r._count.ingredients,
    isFeatured: r.isFeatured,
  });

  return {
    simpler: simplerPick ? toVariant(simplerPick) : null,
    fancier: fancierPick ? toVariant(fancierPick) : null,
  };
}

export const getRecipeVariants = unstable_cache(
  computeVariantsInner,
  ["recipe-variants-v1"],
  { revalidate: 60 * 30, tags: ["recipes"] },
);
