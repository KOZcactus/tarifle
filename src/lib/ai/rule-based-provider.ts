import { prisma } from "@/lib/prisma";
import { computeMatch } from "./matcher";
import { assignRecipeNotes, buildOverallCommentary } from "./commentary";
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
 * ingredient overlap. Used as a fallback when no AI API key is configured,
 * and as the first-pass recall stage when Claude is wired up later.
 */
export class RuleBasedProvider implements AiProvider {
  readonly name = "rule-based" as const;

  async suggest(input: AiSuggestInput): Promise<AiSuggestResponse> {
    // Deterministic candidate pool: always evaluate the same 200 rows for the
    // same filters, so results don't drift when the DB's natural order changes.
    // When we outgrow 200 published recipes, swap this for an ingredient
    // inverted index / trigram scan.
    const recipes = await prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        ...(input.type ? { type: input.type } : {}),
        ...(input.difficulty ? { difficulty: input.difficulty } : {}),
        ...(input.maxMinutes ? { totalMinutes: { lte: input.maxMinutes } } : {}),
      },
      include: {
        ingredients: true,
        category: { select: { name: true } },
      },
      orderBy: [
        { isFeatured: "desc" },
        { viewCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 200,
    });

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
          difficulty: recipe.difficulty,
          totalMinutes: recipe.totalMinutes,
          servingCount: recipe.servingCount,
          averageCalories: recipe.averageCalories,
          matchScore: match.score,
          matchedIngredients: match.matched,
          missingIngredients: match.missing,
        };
      })
      .filter((s) => s.matchScore >= MIN_SCORE)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        // Tie-break: fewer total minutes first — easier to make
        return a.totalMinutes - b.totalMinutes;
      })
      .slice(0, MAX_RESULTS);

    const withNotes = assignRecipeNotes(scored);
    const commentary = buildOverallCommentary(input.ingredients, withNotes);

    return {
      suggestions: withNotes,
      commentary,
      provider: "rule-based",
    };
  }
}
