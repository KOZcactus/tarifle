"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DIFFICULTY_OPTIONS } from "@/lib/constants";

interface FilterCategory {
  name: string;
  slug: string;
  emoji: string | null;
}

interface FilterTag {
  name: string;
  slug: string;
}

interface FilterPanelProps {
  categories?: FilterCategory[];
  tags?: FilterTag[];
}

const TIME_OPTIONS = [
  { value: "", labelKey: "all" },
  { value: "15", labelKey: "under15" },
  { value: "30", labelKey: "under30" },
  { value: "60", labelKey: "under60" },
  { value: "120", labelKey: "under120" },
] as const;

const SORT_OPTIONS = [
  { value: "", labelKey: "newest" },
  { value: "quickest", labelKey: "quickest" },
  { value: "popular", labelKey: "popular" },
] as const;

const DIFFICULTY_KEY_MAP: Record<string, string> = {
  EASY: "difficultyEasy",
  MEDIUM: "difficultyMedium",
  HARD: "difficultyHard",
};

export function FilterPanel({ categories = [], tags = [] }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("filters");
  const tCard = useTranslations("recipes.card");

  const currentDifficulty = searchParams.get("zorluk") ?? "";
  const currentCategory = searchParams.get("kategori") ?? "";
  const currentTime = searchParams.get("sure") ?? "";
  const currentSort = searchParams.get("siralama") ?? "";
  const currentTags = searchParams.getAll("etiket");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/tarifler?${params.toString()}`);
  }

  function toggleTag(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll("etiket");

    params.delete("etiket");
    if (existing.includes(slug)) {
      existing
        .filter((tag) => tag !== slug)
        .forEach((tag) => params.append("etiket", tag));
    } else {
      [...existing, slug].forEach((tag) => params.append("etiket", tag));
    }
    params.delete("page");
    router.push(`/tarifler?${params.toString()}`);
  }

  function clearAll() {
    router.push("/tarifler");
  }

  const hasFilters =
    currentDifficulty || currentCategory || currentTime || currentSort || currentTags.length > 0;

  return (
    <div className="space-y-3">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Difficulty */}
        <select
          value={currentDifficulty}
          onChange={(e) => updateFilter("zorluk", e.target.value)}
          className="h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:border-primary focus:outline-none"
          aria-label={t("difficulty.aria")}
        >
          <option value="">{t("difficulty.all")}</option>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {tCard(DIFFICULTY_KEY_MAP[opt.value] ?? "difficultyEasy")}
            </option>
          ))}
        </select>

        {/* Category */}
        {categories.length > 0 && (
          <select
            value={currentCategory}
            onChange={(e) => updateFilter("kategori", e.target.value)}
            className="h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:border-primary focus:outline-none"
            aria-label={t("category.aria")}
          >
            <option value="">{t("category.all")}</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        )}

        {/* Time */}
        <select
          value={currentTime}
          onChange={(e) => updateFilter("sure", e.target.value)}
          className="h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:border-primary focus:outline-none"
          aria-label={t("time.aria")}
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(`time.${opt.labelKey}`)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => updateFilter("siralama", e.target.value)}
          className="h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:border-primary focus:outline-none"
          aria-label={t("sort.aria")}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(`sort.${opt.labelKey}`)}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-primary hover:underline"
          >
            {t("clear")}
          </button>
        )}
      </div>

      {/* Tag Pills — vegan/vejetaryen have their own dedicated DietFilter
          row below so we strip them from this generic list to avoid the
          same filter appearing in two places. */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags
            .filter((tag) => tag.slug !== "vegan" && tag.slug !== "vejetaryen")
            .map((tag) => {
              const isActive = currentTags.includes(tag.slug);
              return (
                <button
                  key={tag.slug}
                  onClick={() => toggleTag(tag.slug)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-muted hover:border-primary/50 hover:text-text"
                  }`}
                >
                  #{tag.name}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
