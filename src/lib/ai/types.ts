import type { Difficulty, RecipeType } from "@prisma/client";

/**
 * Input a user provides to the AI assistant.
 */
export interface AiSuggestInput {
  /** Raw ingredient names the user has at home, untrimmed, case-insensitive. */
  ingredients: string[];
  /** Recipe category filter. */
  type?: RecipeType;
  /** Maximum total cooking time (in minutes). */
  maxMinutes?: number;
  /** Target difficulty. */
  difficulty?: Difficulty;
  /** If true, common pantry staples (tuz, karabiber, su, yağ) are assumed on hand. */
  assumePantryStaples?: boolean;
  /** Cuisine filter — recipe.cuisine must match one of these codes.
   *  Empty/undefined = no filter (all cuisines, "Hepsi" mode). */
  cuisines?: string[];
  /** Ingredients to exclude — any recipe containing a matching ingredient
   *  is disqualified regardless of match score. */
  excludeIngredients?: string[];
}

/**
 * A single suggested recipe with commentary.
 */
export interface AiSuggestion {
  recipeId: string;
  slug: string;
  title: string;
  emoji: string | null;
  imageUrl: string | null;
  categoryName: string;
  difficulty: Difficulty;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  /** 0..1 — ratio of recipe ingredients the user already has. */
  matchScore: number;
  /** Ingredient names the user had that matched this recipe. */
  matchedIngredients: string[];
  /** Ingredient names the user needs to buy. */
  missingIngredients: string[];
  /** Optional per-recipe AI commentary (empty for rule-based provider). */
  note?: string;
}

/**
 * Aggregated response from an AI provider.
 */
export interface AiSuggestResponse {
  /** Top suggestions sorted by matchScore descending. */
  suggestions: AiSuggestion[];
  /** Provider-level commentary / summary shown above the results (optional). */
  commentary?: string;
  /** Which provider handled this request — useful for UI badges and logs. */
  provider: "rule-based" | "claude-haiku";
}

/**
 * AI provider abstraction. Swap implementations by changing the factory.
 */
export interface AiProvider {
  readonly name: AiSuggestResponse["provider"];
  suggest(input: AiSuggestInput): Promise<AiSuggestResponse>;
}
