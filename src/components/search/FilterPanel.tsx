"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DIFFICULTY_OPTIONS } from "@/lib/constants";
import { CATEGORIES } from "@/data/categories";

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDifficulty = searchParams.get("zorluk") ?? "";
  const currentCategory = searchParams.get("kategori") ?? "";

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

  const hasFilters = currentDifficulty || currentCategory;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Difficulty Filter */}
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

      {/* Category Filter */}
      <select
        value={currentCategory}
        onChange={(e) => updateFilter("kategori", e.target.value)}
        className="h-10 rounded-lg border border-border bg-bg-card px-3 text-sm text-text focus:border-primary focus:outline-none"
        aria-label="Kategori filtresi"
      >
        <option value="">Tüm Kategoriler</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.emoji} {cat.name}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={() => router.push("/tarifler")}
          className="text-sm text-primary hover:underline"
        >
          Filtreleri Temizle
        </button>
      )}
    </div>
  );
}
