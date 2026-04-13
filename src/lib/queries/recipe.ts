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
    select: { variations: true },
  },
} as const;

interface GetRecipesOptions {
  query?: string;
  difficulty?: string;
  categorySlug?: string;
  limit?: number;
  offset?: number;
}

/** Tarif listesi — arama, filtreleme ve sayfalama destekli */
export async function getRecipes(options: GetRecipesOptions = {}): Promise<{
  recipes: RecipeCard[];
  total: number;
}> {
  const { query, difficulty, categorySlug, limit = 24, offset = 0 } = options;

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

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      select: recipeCardSelect,
      orderBy: { createdAt: "desc" },
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
      _count: {
        select: { variations: true, bookmarks: true },
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
