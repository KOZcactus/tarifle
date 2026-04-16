import { prisma } from "@/lib/prisma";
import { computeMatch, recipeContainsExcluded } from "./matcher";
import { assignRecipeNotes, buildOverallCommentary, type CommentaryContext } from "./commentary";
import type {
  AiProvider,
  AiSuggestInput,
  AiSuggestResponse,
  AiSuggestion,
} from "./types";

const MIN_SCORE = 0.3; // Below this, not a useful suggestion
const MAX_RESULTS = 6;

/**
 * Rule-based provider — does DB-side filtering + client-side scoring by
 * ingredient overlap. Evaluates ALL published recipes (no cap) — at 1000
 * recipes × ~6 ingredients, client-side scoring stays <20ms.
 *
 * Filters: type, difficulty, maxMinutes (DB-side), cuisine (DB-side),
 * excludeIngredients (client-side post-score).
 */
export class RuleBasedProvider implements AiProvider {
  readonly name = "rule-based" as const;

  async suggest(input: AiSuggestInput): Promise<AiSuggestResponse> {
    const recipes = await prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        ...(input.type ? { type: input.type } : {}),
        ...(input.difficulty ? { difficulty: input.difficulty } : {}),
        ...(input.maxMinutes
          ? { totalMinutes: { lte: input.maxMinutes } }
          : {}),
        // Cuisine filter — DB-side via btree index. Empty/undefined = all.
        ...(input.cuisines && input.cuisines.length > 0
          ? { cuisine: { in: input.cuisines } }
          : {}),
      },
      include: {
        ingredients: true,
        category: { select: { name: true } },
      },
      // No `take` cap — evaluate all matching recipes. At 1000 recipes
      // × ~6 ingredients, client-side scoring is <20ms. If we ever hit
      // 5000+, swap this for an ingredient inverted index.
      orderBy: { slug: "asc" },
    });

    const excludeList = input.excludeIngredients ?? [];

    const scored: AiSuggestion[] = recipes
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
          matchScore: match.score,
          matchedIngredients: match.matched,
          missingIngredients: match.missing,
          // Keep ingredient list ref for exclude check below
          _ingredients: recipe.ingredients,
        };
      })
      // Exclude recipes containing any of the excluded ingredients
      .filter((s) =>
        excludeList.length === 0
          ? true
          : !recipeContainsExcluded(s._ingredients, excludeList),
      )
      .filter((s) => s.matchScore >= MIN_SCORE)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        // Tie-break: fewer total minutes first — easier to make
        return a.totalMinutes - b.totalMinutes;
      })
      .slice(0, MAX_RESULTS)
      // Strip internal _ingredients field before returning
      .map(({ _ingredients, ...rest }) => rest);

    const withNotes = assignRecipeNotes(scored);
    const commentaryCtx: CommentaryContext = {
      cuisines: input.cuisines,
      type: input.type,
      difficulty: input.difficulty,
      maxMinutes: input.maxMinutes,
    };
    const commentary = buildOverallCommentary(
      input.ingredients,
      withNotes,
      input.cuisines,
      commentaryCtx,
    );

    return {
      suggestions: withNotes,
      commentary,
      provider: "rule-based",
    };
  }
}
