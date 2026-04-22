import type { Allergen } from "@prisma/client";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";
import { dietConfigBySlug } from "@/lib/diets";
import { computeMatch, recipeContainsExcluded } from "./matcher";
import { assignRecipeNotes, buildOverallCommentary, type CommentaryContext } from "./commentary";
import { buildReasons } from "./reasons";
import type {
  AiProvider,
  AiSuggestInput,
  AiSuggestResponse,
  AiSuggestion,
} from "./types";

const MIN_SCORE = 0.3; // Below this, not a useful suggestion
const MAX_RESULTS = 10;

/**
 * Diversification, aynı slug ikinci kez girmesin + top N için kategori
 * ve mutfak çeşitliliği. Kerem'in gözlemi: limonata ardından "Sivas Katmeri"
 * iki kez listede çıkıyor, tüm top 5 aynı kategori. Bu filter sıralı
 * listeden her slug'ı en az bir kez geçirir, sonra kategori başına
 * cap uygular (ilk N için max 2/kategori, 3/cuisine).
 *
 * Algoritma: primary sort (score desc) korunur; dedup + cap sonrası
 * kalan slot'lara kapakı yaşayan kategorilerden tekrar eklenir.
 * v3 sıkılaştırma: cuisine cap eklendi (Türk mutfağı listede dominasyonu
 * azalsın, user'ı "dünya çeşidi" ile buluştur).
 */
export function diversifySuggestions(
  scored: readonly AiSuggestion[],
  limit: number,
  maxPerCategory: number = 2,
  maxPerCuisine: number = 3,
): AiSuggestion[] {
  const seenSlugs = new Set<string>();
  const categoryCount = new Map<string, number>();
  const cuisineCount = new Map<string, number>();
  const primary: AiSuggestion[] = [];
  const overflow: AiSuggestion[] = [];

  for (const s of scored) {
    if (seenSlugs.has(s.slug)) continue;
    seenSlugs.add(s.slug);
    const cat = s.categoryName;
    const cui = s.cuisine ?? "";
    const catCount = categoryCount.get(cat) ?? 0;
    // Cuisine null ise sayma (eski tarifler, cuisine retrofit bekler).
    const cuiCount = cui ? cuisineCount.get(cui) ?? 0 : 0;
    const underCategoryCap = catCount < maxPerCategory;
    const underCuisineCap = !cui || cuiCount < maxPerCuisine;
    if (underCategoryCap && underCuisineCap) {
      primary.push(s);
      categoryCount.set(cat, catCount + 1);
      if (cui) cuisineCount.set(cui, cuiCount + 1);
    } else {
      overflow.push(s);
    }
    if (primary.length >= limit) break;
  }

  // Yeterli sonuç gelmediyse overflow'dan tamamla (cap'ler yerine
  // boş slot yaratmaktansa aynı kategori/cuisine'den tekrar gösterim).
  while (primary.length < limit && overflow.length > 0) {
    const next = overflow.shift();
    if (next) primary.push(next);
  }
  return primary;
}

/**
 * Rule-based provider, does DB-side filtering + client-side scoring by
 * ingredient overlap. Evaluates ALL published recipes (no cap), at 1000
 * recipes × ~6 ingredients, client-side scoring stays <20ms.
 *
 * Filters: type, difficulty, maxMinutes (DB-side), cuisine (DB-side),
 * excludeIngredients (client-side post-score).
 */
export class RuleBasedProvider implements AiProvider {
  readonly name = "rule-based" as const;

  async suggest(input: AiSuggestInput): Promise<AiSuggestResponse> {
    // Diet filter, config'ten tag slug veya allergen exclusion. Tag-based
    // diyetler (vegan/vejetaryen/alkolsuz) recipe.tags.some filtresi,
    // allergen-based diyetler (glutensiz/sutsuz) `NOT hasSome` ile exclude.
    const dietCfg = input.dietSlug
      ? dietConfigBySlug(input.dietSlug)
      : null;

    const recipes = await prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        ...(input.type ? { type: input.type } : {}),
        ...(input.difficulty ? { difficulty: input.difficulty } : {}),
        ...(input.maxMinutes
          ? { totalMinutes: { lte: input.maxMinutes } }
          : {}),
        // Cuisine filter, DB-side via btree index. Empty/undefined = all.
        ...(input.cuisines && input.cuisines.length > 0
          ? { cuisine: { in: input.cuisines } }
          : {}),
        ...(dietCfg?.tagSlug
          ? { tags: { some: { tag: { slug: dietCfg.tagSlug } } } }
          : {}),
        ...(dietCfg?.excludeAllergen
          ? {
              NOT: {
                allergens: { hasSome: [dietCfg.excludeAllergen as Allergen] },
              },
            }
          : {}),
      },
      include: {
        ingredients: true,
        category: { select: { name: true } },
        tags: { select: { tag: { select: { slug: true } } } },
      },
      // No `take` cap, evaluate all matching recipes. At 1000 recipes
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
          hungerBar: recipe.hungerBar,
          matchScore: match.score,
          matchedIngredients: match.matched,
          missingIngredients: match.missing,
          tags: recipe.tags.map((t) => t.tag.slug),
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
        // Tie-break: fewer total minutes first, easier to make
        return a.totalMinutes - b.totalMinutes;
      })
      // Strip internal _ingredients field BEFORE diversification, overflow
      // cap internal AiSuggestion shape üzerinden çalışıyor.
      .map(({ _ingredients, ...rest }) => rest);

    // Diversification, duplicate slug + same-category/cuisine
    // over-concentration düzeltmesi. Max 2/kategori + 3/cuisine ilk 10'da.
    const diversified = diversifySuggestions(scored, MAX_RESULTS, 2, 3);

    // Reason chip'leri (v3 sıkılaştırma): "Tek eksik: un", "⚡ 18 dakika".
    const withReasons = await Promise.all(
      diversified.map(async (s) => ({
        ...s,
        reasons: await buildReasons(
          {
            matchedIngredients: s.matchedIngredients,
            missingIngredients: s.missingIngredients,
            totalMinutes: s.totalMinutes,
          },
          { maxMinutes: input.maxMinutes },
        ),
      })),
    );

    const resolvedLocale = await getLocale();
    const locale = isValidLocale(resolvedLocale) ? resolvedLocale : DEFAULT_LOCALE;
    const withNotes = await assignRecipeNotes(withReasons, locale);
    const commentaryCtx: CommentaryContext = {
      cuisines: input.cuisines,
      type: input.type,
      difficulty: input.difficulty,
      maxMinutes: input.maxMinutes,
    };
    const commentary = await buildOverallCommentary(
      input.ingredients,
      withNotes,
      input.cuisines,
      commentaryCtx,
      locale,
    );

    return {
      suggestions: withNotes,
      commentary,
      provider: "rule-based",
    };
  }
}
