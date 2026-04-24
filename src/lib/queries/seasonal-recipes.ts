import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSeasonalCollection, type SeasonalCollection } from "@/lib/seasonal";

export interface SeasonalRecipeCard {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  imageUrl: string | null;
  totalMinutes: number;
  averageCalories: number | null;
  cuisine: string | null;
  categoryName: string;
}

export interface SeasonalResult {
  collection: SeasonalCollection;
  recipes: SeasonalRecipeCard[];
}

const MAX_RECIPES = 6;

async function computeSeasonal(): Promise<SeasonalResult> {
  const collection = getSeasonalCollection();
  const { tagSlug, categorySlugs } = collection.filter;

  const recipes = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      ...(tagSlug
        ? { tags: { some: { tag: { slug: tagSlug } } } }
        : {}),
      ...(categorySlugs && categorySlugs.length > 0
        ? { category: { slug: { in: categorySlugs } } }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      emoji: true,
      imageUrl: true,
      totalMinutes: true,
      averageCalories: true,
      cuisine: true,
      category: { select: { name: true } },
    },
    orderBy: [
      { isFeatured: "desc" },
      { viewCount: "desc" },
      { slug: "asc" },
    ],
    take: MAX_RECIPES,
  });

  return {
    collection,
    recipes: recipes.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      emoji: r.emoji,
      imageUrl: r.imageUrl,
      totalMinutes: r.totalMinutes,
      averageCalories: r.averageCalories,
      cuisine: r.cuisine,
      categoryName: r.category.name,
    })),
  };
}

/**
 * Cache tagged with "recipes" so any recipe update (Admin Düzenle,
 * Codex apply) invalidates the seasonal shelf. 6 saat TTL, sezon
 * değişimi gün bazlı olduğu için agresif cache güvenli.
 */
export const getSeasonalRecipes = unstable_cache(
  computeSeasonal,
  ["seasonal-recipes-v1"],
  { revalidate: 60 * 60 * 6, tags: ["recipes"] },
);
