"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";
import type { RecipeCard as RecipeCardType } from "@/types/recipe";

interface DietBadgeData {
  /** 0-100 toplam skor */
  score: number;
  /** Gorsel rating, 5 katman */
  rating: "excellent" | "good" | "fair" | "weak" | "poor";
  /** Beta etiketi (Faz 1, USDA enrichment sonrasi false) */
  isBeta: boolean;
}

interface RecipeCardProps {
  recipe: RecipeCardType;
  /** Login + dietProfile + showDietBadge true ise card uzerine kucuk skor
   *  chip render edilir. Pre-computed RecipeDietScore'tan gelir. */
  dietBadge?: DietBadgeData;
}

const DIFFICULTY_VARIANT = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "primary",
} as const;

const DIFFICULTY_KEY = {
  EASY: "difficultyEasy",
  MEDIUM: "difficultyMedium",
  HARD: "difficultyHard",
} as const;

const DIET_RATING_STYLE: Record<DietBadgeData["rating"], string> = {
  excellent: "bg-emerald-500/90 text-white",
  good: "bg-emerald-400/90 text-white",
  fair: "bg-amber-400/90 text-white",
  weak: "bg-orange-400/90 text-white",
  poor: "bg-red-400/90 text-white",
};

export function RecipeCard({ recipe, dietBadge }: RecipeCardProps) {
  const t = useTranslations("recipes.card");
  const tCuisine = useTranslations("cuisines");

  const formattedMinutes = formatMinutes(recipe.totalMinutes, t);
  const difficultyLabel = t(DIFFICULTY_KEY[recipe.difficulty]);
  const cuisineTitle =
    recipe.cuisine && tCuisine.has(recipe.cuisine as CuisineCode)
      ? tCuisine(recipe.cuisine as CuisineCode)
      : recipe.cuisine ?? "";

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

          {/* Category Badge. Recipe ana emoji ile category emoji ayni
              ise (ornek: kategori "Kahve ve Sicak Icecekler" + tarif
              emoji ☕) badge sadece category name gosterir; ayni emoji
              kart uzerinde iki yerde tekrar etmesin (oturum 25 GPT
              audit fix). */}
          <span className="absolute left-3 top-3 rounded-full bg-bg/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
            {recipe.category.emoji && recipe.category.emoji !== recipe.emoji
              ? `${recipe.category.emoji} ${recipe.category.name}`
              : recipe.category.name}
          </span>

          {/* Diyet uyumu skoru chip (oturum 20, DIET_SCORE_PLAN). Sol alt
              kose, kategori badge'inin altinda. Beta mini rozet skor
              chip'in yaninda kucuk; veri proxy oldugu surece kullanici
              uyarilir. Kart sayfasi tiklamada tarif detay "Diyet Uyumu"
              kartina yonlenir. */}
          {dietBadge && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <span
                title={`Diyet uyumu ${dietBadge.score}/100`}
                className={
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm " +
                  DIET_RATING_STYLE[dietBadge.rating]
                }
              >
                <span aria-hidden="true" className="mr-1">
                  🎯
                </span>
                {dietBadge.score}
              </span>
              {dietBadge.isBeta && (
                <span className="rounded-full bg-amber-100/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 backdrop-blur-sm">
                  Beta
                </span>
              )}
            </div>
          )}

          {/* Sağ üst köşe: cuisine flag + editör rozeti. İkisi de varsa
              flag solda (cuisine kimliği), rozet sağda (Tarifle kürasyonu).
              Rozet isFeatured gate'li, admin seçtiği tariflerde görünür. */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {recipe.cuisine && recipe.cuisine !== "tr" && CUISINE_FLAG[recipe.cuisine as CuisineCode] && (
              <span
                className="rounded-full bg-bg/80 px-2 py-1 text-sm backdrop-blur-sm"
                title={cuisineTitle}
              >
                {CUISINE_FLAG[recipe.cuisine as CuisineCode]}
              </span>
            )}
            {recipe.isFeatured && (
              <span
                role="img"
                aria-label={t("editorsPick")}
                title={t("editorsPickTitle")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-sm backdrop-blur-sm"
              >
                <span aria-hidden="true">⭐</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading text-lg font-semibold transition-colors group-hover:text-primary">
            {recipe.title}
          </h3>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={DIFFICULTY_VARIANT[recipe.difficulty]}>
              {difficultyLabel}
            </Badge>
            <Badge>
              <ClockIcon /> {formattedMinutes}
            </Badge>
            {recipe.averageCalories && (
              <Badge>~{recipe.averageCalories} kcal</Badge>
            )}
            {recipe.hungerBar != null && (
              <span
                role="img"
                aria-label={t("hungerBarTitle", { value: recipe.hungerBar })}
                title={t("hungerBarTitle", { value: recipe.hungerBar })}
                className="inline-flex"
              >
                <Badge>
                  <span aria-hidden>🍖</span> {recipe.hungerBar}/10
                </Badge>
              </span>
            )}
          </div>

          {/* Footer */}
          {(recipe._count.variations > 0 ||
            (recipe.cookedCount && recipe.cookedCount > 0)) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              {recipe._count.variations > 0 && (
                <span className="flex items-center gap-1">
                  <UsersIcon />
                  {t("adaptations", { count: recipe._count.variations })}
                </span>
              )}
              {recipe.cookedCount && recipe.cookedCount > 0 ? (
                <span className="flex items-center gap-1">
                  <span aria-hidden>👨‍🍳</span>
                  {recipe.cookedCount === 1
                    ? "1 kişi pişirdi"
                    : `${recipe.cookedCount.toLocaleString("tr-TR")} kişi pişirdi`}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

function formatMinutes(minutes: number, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  if (minutes < 60) return t("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return t("hoursShort", { n: hours });
  return t("hoursMinutes", { h: hours, m: remaining });
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
