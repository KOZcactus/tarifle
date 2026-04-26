import type { Allergen, Difficulty, RecipeStatus, RecipeType } from "@prisma/client";

export interface RecipeCard {
  id: string;
  title: string;
  slug: string;
  emoji: string | null;
  difficulty: Difficulty;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  /**
   * Açlık barı, 1-10 (porsiyon başı tokluk). Null = hesaplanmamış.
   * Listing kartında kompakt chip olarak gösterilir.
   */
  hungerBar: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
  cuisine: string | null;
  category: {
    name: string;
    slug: string;
    emoji: string | null;
  };
  _count: {
    variations: number;
  };
  /**
   * "Pisirdim" toggle isaretleyen unique kullanici sayisi (oturum 23).
   * Card footer'da "X kisi pisirdi" sosyal kanit olarak render edilir.
   * Null/undefined = caller fetch etmemis (anasayfa shelf'leri henuz
   * baglanmadi vb.); 0 = pisiren yok, badge gizlenir.
   */
  cookedCount?: number;
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
  isFeatured: boolean;
  tipNote: string | null;
  servingSuggestion: string | null;
  allergens: Allergen[];
  cuisine: string | null;
  /**
   * Açlık barı, 1-10 integer (porsiyon başı). Null = hesaplanmamış
   * (yeni tarif, retrofit beklenir). UI fallback default 5.
   */
  hungerBar: number | null;
  /**
   * Faz 2 enrichment (oturum 20). RecipeNutrition 1:1, USDA bazli
   * per-porsiyon sugar/fiber/sodium/satFat. NutritionInfo component
   * gosterir. Null = compute pipeline henuz isletilmemis veya tarif
   * yeni eklendi.
   */
  nutrition: {
    sugarPerServing: number | null;
    fiberPerServing: number | null;
    sodiumPerServing: number | null;
    satFatPerServing: number | null;
    matchedRatio: number | null;
  } | null;
  /**
   * Recipe.translations Json?, locale-keyed bundle
   * ({ en?: { title, description, ingredients[], steps[], tipNote,
   * servingSuggestion } }). Schema in prisma/schema.prisma. Runtime shape
   * narrowed by `src/lib/recipe/translate.ts` helpers. `unknown` typed
   * here so pages are forced to go through the validated helpers.
   */
  translations: unknown;
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
    group: string | null;
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
  variations: {
    id: string;
    miniTitle: string;
    description: string | null;
    // JSON columns, coerced to string[] in components.
    ingredients: unknown;
    steps: unknown;
    notes: string | null;
    likeCount: number;
    authorId: string;
    createdAt: Date;
    author: {
      username: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }[];
  _count: {
    variations: number;
    bookmarks: number;
    reviews: number;
  };
}
