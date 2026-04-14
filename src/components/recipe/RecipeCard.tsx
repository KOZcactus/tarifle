import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatMinutes, getDifficultyLabel } from "@/lib/utils";
import type { RecipeCard as RecipeCardType } from "@/types/recipe";

interface RecipeCardProps {
  recipe: RecipeCardType;
}

const DIFFICULTY_VARIANT = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "primary",
} as const;

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/tarif/${recipe.slug}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-border bg-bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        {/* Image / Emoji Placeholder */}
        <div className="relative flex h-48 items-center justify-center bg-bg-elevated">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl transition-transform duration-300 group-hover:scale-110">
              {recipe.emoji ?? "🍽️"}
            </span>
          )}

          {/* Category Badge */}
          <span className="absolute left-3 top-3 rounded-full bg-bg/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
            {recipe.category.emoji} {recipe.category.name}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading text-lg font-semibold transition-colors group-hover:text-primary">
            {recipe.title}
          </h3>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={DIFFICULTY_VARIANT[recipe.difficulty]}>
              {getDifficultyLabel(recipe.difficulty)}
            </Badge>
            <Badge>
              <ClockIcon /> {formatMinutes(recipe.totalMinutes)}
            </Badge>
            {recipe.averageCalories && (
              <Badge>~{recipe.averageCalories} kcal</Badge>
            )}
          </div>

          {/* Footer */}
          {recipe._count.variations > 0 && (
            <div className="mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <UsersIcon />
                {recipe._count.variations} uyarlama
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-1"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
