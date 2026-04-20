import Link from "next/link";
import { getRecipeOfTheDay } from "@/lib/queries/recipe-of-the-day";
import { getDifficultyLabel } from "@/lib/utils";

/**
 * Homepage "Bugünün tarifi" widget. Server component, fetches the daily
 * pick via the helper and renders a single large card with curated copy.
 * Renders nothing when the DB has no PUBLISHED recipes (fresh project).
 *
 * Visual direction: warm accent-orange surface to set it apart from the
 * AI Asistan banner (blue) above it, so the homepage has two distinct
 * spotlight modules instead of one repeated pattern.
 */
export async function RecipeOfTheDay() {
  const data = await getRecipeOfTheDay();
  if (!data) return null;

  const { recipe, intro, curatorNote } = data;

  return (
    <section className="pt-6" aria-labelledby="recipe-of-the-day-heading">
      <Link
        href={`/tarif/${recipe.slug}`}
        className="group flex flex-col gap-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 transition-all hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:gap-6"
      >
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-5xl sm:h-24 sm:w-24 sm:text-6xl">
          <span aria-hidden="true">{recipe.emoji ?? recipe.category.emoji ?? "🍽️"}</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Bugünün tarifi
          </p>
          <h3
            id="recipe-of-the-day-heading"
            className="mt-0.5 font-heading text-xl font-bold text-text sm:text-2xl"
          >
            {recipe.title}
          </h3>
          <p className="mt-1 text-sm italic text-text-muted">
            {intro}: {curatorNote}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">{recipe.category.emoji ?? "📂"}</span>
              {recipe.category.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">⏱️</span>
              {recipe.totalMinutes} dk
            </span>
            <span
              className="inline-flex items-center gap-1"
              title={`Zorluk: ${getDifficultyLabel(recipe.difficulty)}`}
            >
              <span aria-hidden="true">📊</span>
              {getDifficultyLabel(recipe.difficulty)}
            </span>
            {recipe.averageCalories !== null && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">🔥</span>
                ~{recipe.averageCalories} kcal
              </span>
            )}
            {recipe.hungerBar !== null && (
              <span
                className="inline-flex items-center gap-1"
                title={`Açlık barı ${recipe.hungerBar}/10 (porsiyon başı tokluk)`}
              >
                <span aria-hidden="true">🍖</span>
                {recipe.hungerBar}/10
              </span>
            )}
            {recipe._count.variations > 0 && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">✨</span>
                {recipe._count.variations} uyarlama
              </span>
            )}
          </div>
        </div>
        <span className="ml-auto rounded-lg border border-primary/30 bg-bg-card px-4 py-2 text-sm font-medium text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          Tarife git →
        </span>
      </Link>
    </section>
  );
}
