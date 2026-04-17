"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
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

/** Popular ingredients shown as quick-add chips when input is empty. */
const POPULAR_INGREDIENTS = [
  "tavuk", "soğan", "domates", "yumurta", "patates", "biber",
  "pirinç", "makarna", "peynir", "havuç", "kabak", "nohut",
];

/** Suggest these when no results found — common combos that always match. */
const FALLBACK_COMBOS = [
  ["tavuk", "soğan", "biber"],
  ["yumurta", "peynir", "domates"],
  ["makarna", "domates", "sarımsak"],
  ["patates", "soğan", "yumurta"],
];

const TAG_DISPLAY: Record<string, { label: string; color: string }> = {
  "pratik": { label: "Pratik", color: "bg-accent-green/15 text-accent-green" },
  "30-dakika-alti": { label: "30 dk", color: "bg-accent-blue/15 text-accent-blue" },
  "vegan": { label: "Vegan", color: "bg-accent-green/15 text-accent-green" },
  "vejetaryen": { label: "Vejetaryen", color: "bg-accent-green/15 text-accent-green" },
  "tek-tencere": { label: "Tek Tencere", color: "bg-secondary/15 text-secondary" },
  "cocuk-dostu": { label: "Çocuk Dostu", color: "bg-primary/15 text-primary" },
  "butce-dostu": { label: "Bütçe Dostu", color: "bg-secondary/15 text-secondary" },
  "misafir-sofrasi": { label: "Misafir", color: "bg-primary/15 text-primary" },
  "yuksek-protein": { label: "Protein", color: "bg-accent-blue/15 text-accent-blue" },
  "dusuk-kalorili": { label: "Düşük Kal", color: "bg-accent-green/15 text-accent-green" },
};

const TIME_OPTIONS = [
  { value: 15, label: "15 dk'ya kadar" },
  { value: 30, label: "30 dk'ya kadar" },
  { value: 60, label: "1 saate kadar" },
  { value: 120, label: "2 saate kadar" },
];

interface AiAssistantFormProps {
  /** Pre-fetched unique ingredient names for autocomplete. */
  knownIngredients?: string[];
}

/**
 * Normalize for Turkish-aware fuzzy matching.
 * "Tav" should match "Tavuk", "İsp" should match "Ispanak".
 */
function trNormalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

export function AiAssistantForm({ knownIngredients = [] }: AiAssistantFormProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [type, setType] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [maxMinutes, setMaxMinutes] = useState<string>("");
  const [cuisine, setCuisine] = useState<string>("tr");
  const [assumePantry, setAssumePantry] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const [sortMode, setSortMode] = useState<"match" | "fastest" | "least-missing">("match");
  const [result, setResult] = useState<AiSuggestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState<string[][]>([]);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const hasInitedFromUrl = useRef(false);

  // Load state from URL params (shared link).
  // setState inside this effect is intentional: we sync one-time from an
  // external source (URLSearchParams) into component state. The hasInited
  // ref guards against re-runs, so no cascading renders in practice.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (hasInitedFromUrl.current) return;
    const m = searchParams.get("m");
    if (!m) return;
    hasInitedFromUrl.current = true;
    const urlIngredients = m.split(",").map((s) => s.trim()).filter(Boolean);
    if (urlIngredients.length === 0) return;
    setIngredients(urlIngredients);

    const urlCuisine = searchParams.get("mutfak");
    if (urlCuisine) setCuisine(urlCuisine);
    const urlType = searchParams.get("tur");
    if (urlType) setType(urlType);
    const urlDiff = searchParams.get("zorluk");
    if (urlDiff) setDifficulty(urlDiff);
    const urlTime = searchParams.get("sure");
    if (urlTime) setMaxMinutes(urlTime);
    const urlExclude = searchParams.get("haric");
    if (urlExclude) {
      setExcludeIngredients(urlExclude.split(",").map((s) => s.trim()).filter(Boolean));
    }

    // Auto-submit after a tick
    setTimeout(() => formRef.current?.requestSubmit(), 100);
  }, [searchParams]);

  // Load recent searches from localStorage on mount.
  // Mount-only one-shot sync from an external storage source — same reason
  // as above, setState here isn't a cascading-render hazard.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // localStorage unavailable or corrupt — ignore
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  // Autocomplete suggestions — filtered by current input, max 6
  const autocompleteSuggestions = (() => {
    if (!currentInput.trim() || currentInput.trim().length < 2) return [];
    const query = trNormalize(currentInput.trim());
    const alreadyAdded = new Set(ingredients.map((i) => i.toLocaleLowerCase("tr")));
    return knownIngredients
      .filter((name) => {
        const norm = trNormalize(name);
        return norm.includes(query) && !alreadyAdded.has(name.toLocaleLowerCase("tr"));
      })
      .slice(0, 6);
  })();

  function selectSuggestion(name: string) {
    addIngredient(name);
    setShowSuggestions(false);
    setSelectedSuggestionIdx(-1);
  }

  function buildShareUrl(): string {
    const params = new URLSearchParams();
    if (ingredients.length > 0) params.set("m", ingredients.join(","));
    if (cuisine && cuisine !== "all") params.set("mutfak", cuisine);
    if (type) params.set("tur", type);
    if (difficulty) params.set("zorluk", difficulty);
    if (maxMinutes) params.set("sure", maxMinutes);
    if (excludeIngredients.length > 0) params.set("haric", excludeIngredients.join(","));
    return `${window.location.origin}/ai-asistan?${params.toString()}`;
  }

  async function handleShare() {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    }
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
    // Autocomplete navigation
    if (showSuggestions && autocompleteSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) =>
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) =>
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1,
        );
        return;
      }
      if (e.key === "Enter" && selectedSuggestionIdx >= 0) {
        e.preventDefault();
        selectSuggestion(autocompleteSuggestions[selectedSuggestionIdx]!);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setSelectedSuggestionIdx(-1);
        return;
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient(currentInput);
      setShowSuggestions(false);
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
        ref={formRef}
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
              onChange={(e) => {
                setCurrentInput(e.target.value);
                setShowSuggestions(e.target.value.trim().length >= 2);
                setSelectedSuggestionIdx(-1);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => {
                  if (currentInput.trim()) addIngredient(currentInput);
                  setShowSuggestions(false);
                }, 150);
              }}
              onFocus={() => {
                if (currentInput.trim().length >= 2) setShowSuggestions(true);
              }}
              placeholder={
                ingredients.length === 0
                  ? "Örn. domates, soğan, yumurta (virgül veya Enter'la ekle)"
                  : "Yeni malzeme…"
              }
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions && autocompleteSuggestions.length > 0}
              aria-autocomplete="list"
            />
          </div>
          {/* Autocomplete dropdown */}
          {showSuggestions && autocompleteSuggestions.length > 0 && (
            <ul
              className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-bg-card shadow-lg"
              role="listbox"
            >
              {autocompleteSuggestions.map((name, idx) => (
                <li
                  key={name}
                  role="option"
                  aria-selected={idx === selectedSuggestionIdx}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    idx === selectedSuggestionIdx
                      ? "bg-primary/10 text-primary"
                      : "text-text hover:bg-bg-elevated"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur
                    selectSuggestion(name);
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1.5 text-xs text-text-muted">
            Virgül ya da Enter&apos;a basarak her malzemeyi ayrı ekle.
          </p>
          {/* Popular ingredient quick-add chips */}
          {ingredients.length === 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {POPULAR_INGREDIENTS.map((ing) => (
                <button
                  key={ing}
                  type="button"
                  onClick={() => addIngredient(ing)}
                  className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  + {ing}
                </button>
              ))}
            </div>
          )}
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
              <div className="flex items-start justify-between gap-3">
                <p className="flex-1 text-sm leading-relaxed text-text">
                  <span className="mr-1 font-semibold text-accent-blue">🧠 Asistan:</span>
                  {result.commentary}
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
                  title="Bu aramayı paylaş"
                >
                  {shareStatus === "copied" ? "✓ Kopyalandı" : "🔗 Paylaş"}
                </button>
              </div>
            </div>
          )}

          {/* Sort toggle */}
          {result.suggestions.length > 1 && (
            <div className="mb-4 flex items-center gap-1 text-xs">
              <span className="mr-2 text-text-muted">Sıralama:</span>
              {([
                { key: "match" as const, label: "En iyi eşleşme" },
                { key: "fastest" as const, label: "En hızlı" },
                { key: "least-missing" as const, label: "En az eksik" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortMode(key)}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    sortMode === key
                      ? "bg-bg-card font-medium text-text"
                      : "text-text-muted hover:bg-bg-card"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {result.suggestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-text-muted">
                Hiç eşleşme yok. Daha az filtre dene veya malzeme ekle.
              </p>
              <p className="mt-3 text-xs text-text-muted">Bu kombinasyonları dene:</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {FALLBACK_COMBOS.map((combo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setIngredients(combo);
                      setCurrentInput("");
                      setResult(null);
                    }}
                    className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    {combo.join(", ")}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[...result.suggestions]
                .sort((a, b) => {
                  if (sortMode === "fastest") return a.totalMinutes - b.totalMinutes;
                  if (sortMode === "least-missing") return a.missingIngredients.length - b.missingIngredients.length;
                  return b.matchScore - a.matchScore; // default: match
                })
                .map((s) => (
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
          {/* Match score with progress bar */}
          <div className="shrink-0 text-right">
            <span
              className={`text-xs font-semibold ${
                perfect
                  ? "text-accent-green"
                  : matchPercent >= 70
                    ? "text-secondary"
                    : "text-text-muted"
              }`}
            >
              %{matchPercent}
            </span>
            <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className={`h-full rounded-full transition-all ${
                  perfect
                    ? "bg-accent-green"
                    : matchPercent >= 70
                      ? "bg-secondary"
                      : "bg-text-muted/40"
                }`}
                style={{ width: `${matchPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tag chips */}
        {s.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.tags
              .filter((t) => TAG_DISPLAY[t])
              .slice(0, 3)
              .map((t) => (
                <span
                  key={t}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_DISPLAY[t]!.color}`}
                >
                  {TAG_DISPLAY[t]!.label}
                </span>
              ))}
          </div>
        )}

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
