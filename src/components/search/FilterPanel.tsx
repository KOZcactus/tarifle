"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  { value: "", label: "Tüm Süreler" },
  { value: "15", label: "15 dk altı" },
  { value: "30", label: "30 dk altı" },
  { value: "60", label: "1 saat altı" },
  { value: "120", label: "2 saat altı" },
] as const;

const SORT_OPTIONS = [
  { value: "", label: "En Yeni" },
  { value: "quickest", label: "En Hızlı" },
  { value: "popular", label: "En Popüler" },
] as const;

export function FilterPanel({ categories = [], tags = [] }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        .filter((t) => t !== slug)
        .forEach((t) => params.append("etiket", t));
    } else {
      [...existing, slug].forEach((t) => params.append("etiket", t));
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
          aria-label="Zorluk filtresi"
        >
          <option value="">Tüm Zorluklar</option>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Category */}
        {categories.length > 0 && (
          <select
            value={currentCategory}
            onChange={(e) => updateFilter("kategori", e.target.value)}
            className="h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:border-primary focus:outline-none"
            aria-label="Kategori filtresi"
          >
            <option value="">Tüm Kategoriler</option>
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
          aria-label="Süre filtresi"
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => updateFilter("siralama", e.target.value)}
          className="h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:border-primary focus:outline-none"
          aria-label="Sıralama"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-primary hover:underline"
          >
            Temizle
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
