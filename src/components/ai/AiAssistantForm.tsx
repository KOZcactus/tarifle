"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { suggestRecipesAction } from "@/lib/actions/ai";
import type { AiSuggestResponse } from "@/lib/ai/types";
import { formatMinutes, getDifficultyLabel } from "@/lib/utils";
import { DIFFICULTY_OPTIONS, RECIPE_TYPE_LABELS } from "@/lib/constants";
import {
  CUISINE_CODES,
  CUISINE_LABEL,
  CUISINE_FLAG,
  type CuisineCode,
} from "@/lib/cuisines";

const TIME_OPTIONS = [
  { value: 15, label: "15 dk'ya kadar" },
  { value: 30, label: "30 dk'ya kadar" },
  { value: 60, label: "1 saate kadar" },
  { value: 120, label: "2 saate kadar" },
];

export function AiAssistantForm() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [type, setType] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [maxMinutes, setMaxMinutes] = useState<string>("");
  const [cuisine, setCuisine] = useState<string>("tr");
  const [assumePantry, setAssumePantry] = useState(true);
  const [result, setResult] = useState<AiSuggestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState<string[][]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // localStorage unavailable or corrupt — ignore
    }
  }, []);

  const saveSearch = useCallback((ings: string[]) => {
    try {
      const key = ings.map((i) => i.toLocaleLowerCase("tr")).sort().join(",");
      const existing = JSON.parse(localStorage.getItem("ai-recent-searches") ?? "[]") as string[][];
      // Dedup by sorted key
      const filtered = existing.filter(
        (e) => e.map((i) => i.toLocaleLowerCase("tr")).sort().join(",") !== key,
      );
      const updated = [ings, ...filtered].slice(0, 3);
      localStorage.setItem("ai-recent-searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // ignore
    }
  }, []);

  function addIngredient(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "");
    if (!trimmed) return;
    if (ingredients.includes(trimmed.toLocaleLowerCase("tr"))) return;
    setIngredients([...ingredients, trimmed]);
    setCurrentInput("");
  }

  function addExclude(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "");
    if (!trimmed) return;
    if (excludeIngredients.includes(trimmed.toLocaleLowerCase("tr"))) return;
    setExcludeIngredients([...excludeIngredients, trimmed]);
    setExcludeInput("");
  }

  function handleExcludeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addExclude(excludeInput);
    } else if (e.key === "Backspace" && !excludeInput && excludeIngredients.length > 0) {
      setExcludeIngredients(excludeIngredients.slice(0, -1));
    }
  }

  function removeExclude(index: number) {
    setExcludeIngredients(excludeIngredients.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient(currentInput);
    } else if (e.key === "Backspace" && !currentInput && ingredients.length > 0) {
      setIngredients(ingredients.slice(0, -1));
    }
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // If the user typed something but didn't press Enter, accept it
    const finalIngredients =
      currentInput.trim().length > 0
        ? [...ingredients, currentInput.trim()]
        : ingredients;

    if (finalIngredients.length === 0) {
      setError("En az bir malzeme gir.");
      return;
    }

    startTransition(async () => {
      const payload = {
        ingredients: finalIngredients,
        type: type || undefined,
        difficulty: difficulty || undefined,
        maxMinutes: maxMinutes ? Number(maxMinutes) : undefined,
        assumePantryStaples: assumePantry,
        cuisines: cuisine ? (cuisine === "all" ? undefined : [cuisine]) : undefined,
        excludeIngredients: excludeIngredients.length > 0 ? excludeIngredients : undefined,
      };
      const response = await suggestRecipesAction(payload);
      if (!response.success || !response.data) {
        setError(response.error ?? "Öneriler alınamadı.");
        setResult(null);
        return;
      }
      setIngredients(finalIngredients);
      setCurrentInput("");
      setResult(response.data);
      saveSearch(finalIngredients);
    });
  }

  return (
    <div className="space-y-8">
      {/* Recent searches */}
      {recentSearches.length > 0 && !result && (
        <div className="rounded-lg border border-dashed border-border bg-bg-card/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Son aramalar
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIngredients(search);
                  setCurrentInput("");
                  setResult(null);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                <span aria-hidden="true">🕒</span>
                {search.slice(0, 3).join(", ")}
                {search.length > 3 && ` +${search.length - 3}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6"
      >
        {/* Ingredients chips input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text">
            Elindeki malzemeler
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 focus-within:border-primary">
            {ingredients.map((ing, i) => (
              <span
                key={`${ing}-${i}`}
                className="flex items-center gap-1.5 rounded-full bg-accent-blue/10 px-3 py-1 text-sm text-accent-blue"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  aria-label={`${ing} kaldır`}
                  className="text-accent-blue/60 transition-colors hover:text-accent-blue"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => currentInput.trim() && addIngredient(currentInput)}
              placeholder={
                ingredients.length === 0
                  ? "Örn. domates, soğan, yumurta (virgül veya Enter'la ekle)"
                  : "Yeni malzeme…"
              }
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            Virgül ya da Enter&apos;a basarak her malzemeyi ayrı ekle.
          </p>
        </div>

        {/* Exclude ingredients chips input */}
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-text">
            Bu malzemeler olmasın
            <span className="ml-1 text-xs font-normal text-text-muted">(opsiyonel)</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 focus-within:border-error/60">
            {excludeIngredients.map((ing, i) => (
              <span
                key={`ex-${ing}-${i}`}
                className="flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-sm text-error"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => removeExclude(i)}
                  aria-label={`${ing} hariç tutmayı kaldır`}
                  className="text-error/60 transition-colors hover:text-error"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              onKeyDown={handleExcludeKeyDown}
              onBlur={() => excludeInput.trim() && addExclude(excludeInput)}
              placeholder={
                excludeIngredients.length === 0
                  ? "Örn. fıstık, yumurta (alerji veya tercih)"
                  : "Başka malzeme…"
              }
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="ai-filter-type"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Tür
            </label>
            <select
              id="ai-filter-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Fark etmez</option>
              {Object.entries(RECIPE_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-time"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Süre
            </label>
            <select
              id="ai-filter-time"
              value={maxMinutes}
              onChange={(e) => setMaxMinutes(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Fark etmez</option>
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-difficulty"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Zorluk
            </label>
            <select
              id="ai-filter-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Fark etmez</option>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-cuisine"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Mutfak
            </label>
            <select
              id="ai-filter-cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="all">Hepsi</option>
              {CUISINE_CODES.map((code) => (
                <option key={code} value={code}>
                  {CUISINE_FLAG[code]} {CUISINE_LABEL[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pantry toggle */}
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-bg-elevated p-3">
          <input
            type="checkbox"
            checked={assumePantry}
            onChange={(e) => setAssumePantry(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
          />
          <span className="flex-1 text-sm">
            <span className="font-medium text-text">
              Tuz, karabiber, su ve yağ hep bende var
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">
              Bu temel malzemeler eşleşmeye dahil edilir.
            </span>
          </span>
        </label>

        {error && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-75 sm:w-auto"
        >
          {isPending ? (
            <>
              <span className="inline-flex gap-0.5" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-white" />
                <span
                  className="h-1.5 w-1.5 animate-[pulse_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-white"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-[pulse_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-white"
                  style={{ animationDelay: "0.4s" }}
                />
              </span>
              Düşünüyor…
            </>
          ) : (
            "Tarif öner"
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <section>
          {result.commentary && (
            <div className="mb-6 rounded-xl border border-accent-blue/30 bg-accent-blue/5 p-4">
              <p className="text-sm leading-relaxed text-text">
                <span className="mr-1 font-semibold text-accent-blue">🧠 Asistan:</span>
                {result.commentary}
              </p>
            </div>
          )}

          {result.suggestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-text-muted">
                Hiç eşleşme yok. Daha az filtre dene veya malzeme ekle.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.suggestions.map((s) => (
                <SuggestionCard key={s.recipeId} suggestion={s} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion: s,
}: {
  suggestion: AiSuggestResponse["suggestions"][number];
}) {
  const matchPercent = Math.round(s.matchScore * 100);
  const perfect = s.missingIngredients.length === 0;

  return (
    <Link
      href={`/tarif/${s.slug}`}
      className="group flex gap-4 overflow-hidden rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary hover:shadow-sm"
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
        {s.imageUrl ? (
          <img
            src={s.imageUrl}
            alt=""
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-4xl">{s.emoji}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted">
              {s.cuisine && CUISINE_FLAG[s.cuisine as CuisineCode] && (
                <span className="mr-1" aria-label={CUISINE_LABEL[s.cuisine as CuisineCode]}>
                  {CUISINE_FLAG[s.cuisine as CuisineCode]}
                </span>
              )}
              {s.categoryName}
            </p>
            <h3 className="font-heading text-lg font-bold text-text transition-colors group-hover:text-primary">
              {s.title}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              perfect
                ? "bg-accent-green/15 text-accent-green"
                : matchPercent >= 70
                  ? "bg-secondary/15 text-secondary"
                  : "bg-bg-elevated text-text-muted"
            }`}
          >
            %{matchPercent} eşleşme
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-text-muted">
          <span>{getDifficultyLabel(s.difficulty)}</span>
          <span>·</span>
          <span>⏱ {formatMinutes(s.totalMinutes)}</span>
          {s.averageCalories && (
            <>
              <span>·</span>
              <span>~{s.averageCalories} kcal</span>
            </>
          )}
        </div>

        {s.missingIngredients.length > 0 && (
          <p className="text-xs text-text-muted">
            <span className="font-medium text-warning">Eksik:</span>{" "}
            {s.missingIngredients.slice(0, 4).join(", ")}
            {s.missingIngredients.length > 4 &&
              ` +${s.missingIngredients.length - 4} daha`}
          </p>
        )}
        {perfect && (
          <p className="text-xs font-medium text-accent-green">
            ✓ Tüm malzemeler elinde!
          </p>
        )}
        {s.note && (
          <p className="mt-0.5 text-xs italic text-accent-blue">— {s.note}</p>
        )}
      </div>
    </Link>
  );
}
