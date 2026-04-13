import type { Difficulty, RecipeStatus, RecipeType } from "@prisma/client";

export interface RecipeCard {
  id: string;
  title: string;
  slug: string;
  emoji: string | null;
  difficulty: Difficulty;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
  category: {
    name: string;
    slug: string;
    emoji: string | null;
  };
  _count: {
    variations: number;
  };
}

export interface RecipeDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  emoji: string | null;
  type: RecipeType;
  difficulty: Difficulty;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  imageUrl: string | null;
  videoUrl: string | null;
  status: RecipeStatus;
  viewCount: number;
  tipNote: string | null;
  servingSuggestion: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    emoji: string | null;
  };
  ingredients: {
    id: string;
    name: string;
    amount: string;
    unit: string | null;
    sortOrder: number;
    isOptional: boolean;
  }[];
  steps: {
    id: string;
    stepNumber: number;
    instruction: string;
    tip: string | null;
    imageUrl: string | null;
    timerSeconds: number | null;
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  _count: {
    variations: number;
    bookmarks: number;
  };
}
