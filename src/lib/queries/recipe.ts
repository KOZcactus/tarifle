import { prisma } from "@/lib/prisma";
import type { Difficulty } from "@prisma/client";
import type { RecipeCard, RecipeDetail } from "@/types/recipe";

// Ortak select — RecipeCard tipi için
const recipeCardSelect = {
  id: true,
  title: true,
  slug: true,
  emoji: true,
  difficulty: true,
  totalMinutes: true,
  servingCount: true,
  averageCalories: true,
  imageUrl: true,
  isFeatured: true,
  category: {
    select: { name: true, slug: true, emoji: true },
  },
  _count: {
    // Card grids (home, kategoriler, tarifler list) read this — keep the
    // public count consistent with what the user sees on the detail page.
    select: { variations: { where: { status: "PUBLISHED" } } },
  },
} as const;

interface GetRecipesOptions {
  query?: string;
  difficulty?: string;
  categorySlug?: string;
  maxMinutes?: number;
  tagSlugs?: string[];
  sortBy?: "newest" | "quickest" | "popular" | "alphabetical";
  limit?: number;
  offset?: number;
}

/** Tarif listesi — arama, filtreleme ve sayfalama destekli */
export async function getRecipes(options: GetRecipesOptions = {}): Promise<{
  recipes: RecipeCard[];
  total: number;
}> {
  const {
    query,
    difficulty,
    categorySlug,
    maxMinutes,
    tagSlugs,
    sortBy = "alphabetical",
    limit = 24,
    offset = 0,
  } = options;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      {
        ingredients: {
          some: { name: { contains: query, mode: "insensitive" } },
        },
      },
    ];
  }

  if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
    where.difficulty = difficulty as Difficulty;
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (maxMinutes && maxMinutes > 0) {
    where.totalMinutes = { lte: maxMinutes };
  }

  if (tagSlugs && tagSlugs.length > 0) {
    where.tags = {
      some: { tag: { slug: { in: tagSlugs } } },
    };
  }

  // Default is now alphabetical — feels natural for a browse page and
  // avoids clustering by recently-inserted seed batches (the old "newest"
  // default always pushed drinks to the top because their timestamps
  // happened to be last in the final seed run).
  const orderBy =
    sortBy === "quickest"
      ? { totalMinutes: "asc" as const }
      : sortBy === "popular"
        ? { viewCount: "desc" as const }
        : sortBy === "newest"
          ? { createdAt: "desc" as const }
          : // alphabetical (default)
            { title: "asc" as const };

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      select: recipeCardSelect,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.recipe.count({ where }),
  ]);

  return { recipes: recipes as unknown as RecipeCard[], total };
}

/** Öne çıkan tarifler */
export async function getFeaturedRecipes(limit = 6): Promise<RecipeCard[]> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    select: recipeCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return recipes as unknown as RecipeCard[];
}

/** 30 dakika altı hızlı tarifler */
export async function getQuickRecipes(limit = 8): Promise<RecipeCard[]> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED", totalMinutes: { lte: 30 } },
    select: recipeCardSelect,
    orderBy: { totalMinutes: "asc" },
    take: limit,
  });

  return recipes as unknown as RecipeCard[];
}

/** Tek tarif detayı — slug ile */
export async function getRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      emoji: true,
      type: true,
      difficulty: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      imageUrl: true,
      videoUrl: true,
      status: true,
      viewCount: true,
      tipNote: true,
      servingSuggestion: true,
      createdAt: true,
      category: {
        select: { id: true, name: true, slug: true, emoji: true },
      },
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
          unit: true,
          sortOrder: true,
          isOptional: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: {
          id: true,
          stepNumber: true,
          instruction: true,
          tip: true,
          imageUrl: true,
          timerSeconds: true,
        },
        orderBy: { stepNumber: "asc" },
      },
      tags: {
        select: {
          tag: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      variations: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          miniTitle: true,
          description: true,
          // ingredients/steps/notes are needed by the new accordion in
          // VariationCard. Stored as JSON columns; the component coerces
          // back to string[] safely.
          ingredients: true,
          steps: true,
          notes: true,
          likeCount: true,
          createdAt: true,
          author: {
            select: { username: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { likeCount: "desc" },
      },
      _count: {
        select: {
          // Only count what the public actually sees — HIDDEN/PENDING_REVIEW
          // variations (or REJECTED, DRAFT) shouldn't inflate the badge on
          // the recipe page or in card grids.
          variations: { where: { status: "PUBLISHED" } },
          bookmarks: true,
        },
      },
    },
  });

  if (!recipe || recipe.status !== "PUBLISHED") return null;

  // Decimal → number dönüşümü
  return {
    ...recipe,
    protein: recipe.protein ? Number(recipe.protein) : null,
    carbs: recipe.carbs ? Number(recipe.carbs) : null,
    fat: recipe.fat ? Number(recipe.fat) : null,
    createdAt: recipe.createdAt.toISOString(),
  } as RecipeDetail;
}

/** Görüntülenme sayısını artır (fire-and-forget) */
export async function incrementViewCount(slug: string): Promise<void> {
  await prisma.recipe.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  });
}
