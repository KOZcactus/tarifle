"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { suggestRecipesAction } from "@/lib/actions/ai";
import type { AiSuggestResponse } from "@/lib/ai/types";
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

/** Color tokens for tag chips — labels come from i18n (form.tags.*). */
const TAG_COLOR: Record<string, string> = {
  "pratik": "bg-accent-green/15 text-accent-green",
  "30-dakika-alti": "bg-accent-blue/15 text-accent-blue",
  "vegan": "bg-accent-green/15 text-accent-green",
  "vejetaryen": "bg-accent-green/15 text-accent-green",
  "tek-tencere": "bg-secondary/15 text-secondary",
  "cocuk-dostu": "bg-primary/15 text-primary",
  "butce-dostu": "bg-secondary/15 text-secondary",
  "misafir-sofrasi": "bg-primary/15 text-primary",
  "yuksek-protein": "bg-accent-blue/15 text-accent-blue",
  "dusuk-kalorili": "bg-accent-green/15 text-accent-green",
};

const TIME_OPTIONS: { value: number; key: "min15" | "min30" | "hr1" | "hr2" }[] = [
  { value: 15, key: "min15" },
  { value: 30, key: "min30" },
  { value: 60, key: "hr1" },
  { value: 120, key: "hr2" },
];

const DIFFICULTY_KEY = {
  EASY: "difficultyEasy",
  MEDIUM: "difficultyMedium",
  HARD: "difficultyHard",
} as const;

type CardT = (key: string, values?: Record<string, string | number>) => string;

function formatMinutesI18n(minutes: number, t: CardT): string {
  if (minutes < 60) return t("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return t("hoursShort", { n: hours });
  return t("hoursMinutes", { h: hours, m: remaining });
}

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
  const t = useTranslations("aiAssistant");
  const tForm = useTranslations("aiAssistant.form");
  const tTime = useTranslations("aiAssistant.form.timeOptions");
  const tType = useTranslations("aiAssistant.recipeTypes");
  const tErr = useTranslations("aiAssistant.errors");
  const tResult = useTranslations("aiAssistant.result");
  const tTag = useTranslations("aiAssistant.tags");
  const tCard = useTranslations("recipes.card");
  const tCuisine = useTranslations("cuisines");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [type, setType] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [maxMinutes, setMaxMinutes] = useState<string>("");
  const [cuisine, setCuisine] = useState<string>("tr");
  const [dietSlug, setDietSlug] = useState<string>("");
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
      setError(tErr("ingredientRequired"));
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
        dietSlug: dietSlug || undefined,
        excludeIngredients: excludeIngredients.length > 0 ? excludeIngredients : undefined,
      };
      const response = await suggestRecipesAction(payload);
      if (!response.success || !response.data) {
        setError(response.error ?? tErr("suggestionsFailed"));
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
            {t("recentSearches")}
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
            {tForm("ingredientsLabel")}
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
                  aria-label={tForm("ingredientChipRemove", { ingredient: ing })}
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
                  ? tForm("ingredientsPlaceholderEmpty")
                  : tForm("ingredientsPlaceholderMore")
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
            {tForm("ingredientsHelper")}
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
            {tForm("excludeLabel")}
            <span className="ml-1 text-xs font-normal text-text-muted">{tForm("excludeOptional")}</span>
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
                  aria-label={tForm("excludeChipRemove", { ingredient: ing })}
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
                  ? tForm("excludePlaceholderEmpty")
                  : tForm("excludePlaceholderMore")
              }
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <label
              htmlFor="ai-filter-type"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("typeLabel")}
            </label>
            <select
              id="ai-filter-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("anyOption")}</option>
              {Object.keys(RECIPE_TYPE_LABELS).map((val) => (
                <option key={val} value={val}>
                  {tType(val)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-time"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("timeLabel")}
            </label>
            <select
              id="ai-filter-time"
              value={maxMinutes}
              onChange={(e) => setMaxMinutes(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("anyOption")}</option>
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {tTime(opt.key)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-difficulty"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("difficultyLabel")}
            </label>
            <select
              id="ai-filter-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("anyOption")}</option>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {tCard(DIFFICULTY_KEY[opt.value])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-cuisine"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("cuisineLabel")}
            </label>
            <select
              id="ai-filter-cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="all">{tForm("allCuisinesOption")}</option>
              {CUISINE_CODES.map((code) => (
                <option key={code} value={code}>
                  {CUISINE_FLAG[code]} {tCuisine.has(code) ? tCuisine(code) : CUISINE_LABEL[code]}
                </option>
              ))}
            </select>
          </div>

          {/* Diet filter — vegan/vejetaryen/glutensiz/sutsuz/alkolsuz.
              Diet config src/lib/diets.ts; "Farketmez" seçiliyse
              kısıt yok. Tag-based diyetler tag filter'ı, allergen-based
              diyetler allergen exclusion ile DB-side filtrelenir. */}
          <div>
            <label
              htmlFor="ai-filter-diet"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("dietLabel")}
            </label>
            <select
              id="ai-filter-diet"
              value={dietSlug}
              onChange={(e) => setDietSlug(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("dietAnyOption")}</option>
              <option value="vegan">🌱 {tForm("dietVegan")}</option>
              <option value="vejetaryen">🥗 {tForm("dietVejetaryen")}</option>
              <option value="glutensiz">🌾 {tForm("dietGlutensiz")}</option>
              <option value="sutsuz">🥛 {tForm("dietSutsuz")}</option>
              <option value="alkolsuz">🥤 {tForm("dietAlkolsuz")}</option>
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
              {tForm("pantryLabel")}
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">
              {tForm("pantryHelper")}
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
              {tForm("submitting")}
            </>
          ) : (
            tForm("submit")
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
                  <span className="mr-1 font-semibold text-accent-blue">{tResult("assistantPrefix")}</span>
                  {result.commentary}
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
                  title={tResult("shareTitle")}
                >
                  {shareStatus === "copied" ? tResult("shareCopied") : tResult("shareIdle")}
                </button>
              </div>
            </div>
          )}

          {/* Sort toggle */}
          {result.suggestions.length > 1 && (
            <div className="mb-4 flex items-center gap-1 text-xs">
              <span className="mr-2 text-text-muted">{tResult("sortLabel")}</span>
              {([
                { key: "match" as const, label: tResult("sortMatch") },
                { key: "fastest" as const, label: tResult("sortFastest") },
                { key: "least-missing" as const, label: tResult("sortLeastMissing") },
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
                {tResult("emptyTitle")}
              </p>
              <p className="mt-3 text-xs text-text-muted">{tResult("emptyComboHint")}</p>
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
                <SuggestionCard
                  key={s.recipeId}
                  suggestion={s}
                  tCard={tCard}
                  tCuisine={tCuisine as (k: string) => string}
                  hasCuisineLabel={(code) => tCuisine.has(code)}
                  tTag={tTag as (k: string) => string}
                  hasTagLabel={(slug) => tTag.has(slug)}
                  tResult={tResult}
                  difficultyLabel={(d) => tCard(DIFFICULTY_KEY[d])}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AiSuggestResponse["suggestions"][number];
  tCard: CardT;
  tCuisine: (k: string) => string;
  hasCuisineLabel: (code: string) => boolean;
  tTag: (k: string) => string;
  hasTagLabel: (slug: string) => boolean;
  tResult: (key: string, values?: Record<string, string | number>) => string;
  difficultyLabel: (d: "EASY" | "MEDIUM" | "HARD") => string;
}

function SuggestionCard({
  suggestion: s,
  tCard,
  tCuisine,
  hasCuisineLabel,
  tTag,
  hasTagLabel,
  tResult,
  difficultyLabel,
}: SuggestionCardProps) {
  const matchPercent = Math.round(s.matchScore * 100);
  const perfect = s.missingIngredients.length === 0;
  const cuisineCode = s.cuisine as CuisineCode | null | undefined;
  const cuisineLabel =
    cuisineCode && hasCuisineLabel(cuisineCode)
      ? tCuisine(cuisineCode)
      : cuisineCode
        ? CUISINE_LABEL[cuisineCode]
        : "";

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
              {cuisineCode && CUISINE_FLAG[cuisineCode] && (
                <span className="mr-1" aria-label={cuisineLabel}>
                  {CUISINE_FLAG[cuisineCode]}
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
              {tResult("matchPercent", { percent: matchPercent })}
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
              .filter((slug) => hasTagLabel(slug) && TAG_COLOR[slug])
              .slice(0, 3)
              .map((slug) => (
                <span
                  key={slug}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_COLOR[slug]}`}
                >
                  {tTag(slug)}
                </span>
              ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 text-xs text-text-muted">
          <span>{difficultyLabel(s.difficulty)}</span>
          <span>·</span>
          <span>⏱ {formatMinutesI18n(s.totalMinutes, tCard)}</span>
          {s.averageCalories && (
            <>
              <span>·</span>
              <span>{tResult("calories", { kcal: s.averageCalories })}</span>
            </>
          )}
        </div>

        {s.missingIngredients.length > 0 && (
          <p className="text-xs text-text-muted">
            <span className="font-medium text-warning">{tResult("missingPrefix")}</span>{" "}
            {s.missingIngredients.slice(0, 4).join(", ")}
            {s.missingIngredients.length > 4 &&
              ` ${tResult("missingMore", { count: s.missingIngredients.length - 4 })}`}
          </p>
        )}
        {perfect && (
          <p className="text-xs font-medium text-accent-green">
            {tResult("perfectMatch")}
          </p>
        )}
        {s.note && (
          <p className="mt-0.5 text-xs italic text-accent-blue">— {s.note}</p>
        )}
      </div>
    </Link>
  );
}
