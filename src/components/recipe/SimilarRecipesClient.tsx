"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { SimilarRecipeCard } from "@/lib/queries/similar-recipes";

type FilterKind = "default" | "faster" | "fewer-ingredients" | "less-calorie";

interface SimilarRecipesClientProps {
  recipes: SimilarRecipeCard[];
}

/**
 * I: "Benzer ama..." filter chip row. Client-side filter/sort, zero
 * network. Default tüm benzer tarifleri order'ında gösterir; chip'ler:
 *   - ⚡ Daha hızlı: totalMinutes ascending sort
 *   - 🧺 Daha az malzeme: ingredientCount ascending sort
 *   - 🔥 Daha az kalori: averageCalories ascending sort (null'lar sona)
 *
 * Her chip click kendini toggle eder + diğerlerini deaktif eder. 6 tarif
 * içinde client sort, O(n log n) trivial.
 */
export function SimilarRecipesClient({ recipes }: SimilarRecipesClientProps) {
  const t = useTranslations("similarRecipes");
  const [filter, setFilter] = useState<FilterKind>("default");

  const filtered = useMemo(() => {
    switch (filter) {
      case "faster":
        return [...recipes].sort((a, b) => a.totalMinutes - b.totalMinutes);
      case "fewer-ingredients":
        return [...recipes].sort((a, b) => a.ingredientCount - b.ingredientCount);
      case "less-calorie":
        return [...recipes].sort((a, b) => {
          if (a.averageCalories === null && b.averageCalories === null) return 0;
          if (a.averageCalories === null) return 1;
          if (b.averageCalories === null) return -1;
          return a.averageCalories - b.averageCalories;
        });
      case "default":
      default:
        return recipes;
    }
  }, [recipes, filter]);

  function chipClass(kind: FilterKind): string {
    return filter === kind
      ? "border-primary bg-primary/10 text-primary font-semibold"
      : "border-border bg-bg-card text-text-muted hover:border-primary/40 hover:text-text";
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-text-muted">{t("filterLabel")}</span>
        <button
          type="button"
          onClick={() => setFilter("default")}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${chipClass("default")}`}
        >
          {t("filterDefault")}
        </button>
        <button
          type="button"
          onClick={() => setFilter(filter === "faster" ? "default" : "faster")}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${chipClass("faster")}`}
        >
          ⚡ {t("filterFaster")}
        </button>
        <button
          type="button"
          onClick={() =>
            setFilter(filter === "fewer-ingredients" ? "default" : "fewer-ingredients")
          }
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${chipClass("fewer-ingredients")}`}
        >
          🧺 {t("filterFewerIngredients")}
        </button>
        <button
          type="button"
          onClick={() => setFilter(filter === "less-calorie" ? "default" : "less-calorie")}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${chipClass("less-calorie")}`}
        >
          🔥 {t("filterLessCalorie")}
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </>
  );
}
