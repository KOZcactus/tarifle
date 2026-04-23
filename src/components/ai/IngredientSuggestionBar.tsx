"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  /** Current textarea value (ingredients CSV/newline). */
  text: string;
  /** Callback to mutate the textarea value from a suggestion click. */
  onReplaceLast: (replacement: string) => void;
  /** Optional class for outer wrapper. */
  className?: string;
}

function extractLastToken(text: string): string {
  // Split on commas and newlines, keep the tail the user is still typing.
  const parts = text.split(/[,\n]/);
  const last = parts[parts.length - 1] ?? "";
  return last.trim();
}

/**
 * Shown under pantry textareas (v3 AI Asistan, v4 menu planner). Fetches
 * top-10 ingredient suggestions from `/api/ingredients/search` keyed on the
 * last token the user is typing; debounced 200ms. Clicking a chip replaces
 * only the last token, leaving prior ingredients intact.
 *
 * Rule-based, zero-cost UX polish: maps the recipe ingredient index to a
 * live autocomplete surface without touching any LLM API.
 */
export function IngredientSuggestionBar({
  text,
  onReplaceLast,
  className = "",
}: Props) {
  const t = useTranslations("ingredientSuggestion");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const lastToken = extractLastToken(text);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/ingredients/search?q=${encodeURIComponent(lastToken)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data: { suggestions?: string[] } = await res.json();
        setSuggestions((data.suggestions ?? []).slice(0, 10));
      } catch {
        // AbortError: user kept typing; silently ignore.
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [text]);

  if (suggestions.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-xs ${className}`}
      role="group"
      aria-label={t("label")}
    >
      <span className="text-text-muted">{t("label")}</span>
      {suggestions.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onReplaceLast(name)}
          className="rounded-full border border-surface-muted bg-surface px-2 py-0.5 text-text-muted transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={t("addAria", { name })}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

/**
 * Helper to build a new textarea value that replaces only the last
 * comma/newline-separated token with the clicked suggestion.
 */
export function replaceLastToken(text: string, replacement: string): string {
  if (!text.trim()) return `${replacement}, `;
  // Find the last separator (comma or newline).
  const match = text.match(/^([\s\S]*[,\n])\s*([^,\n]*)$/);
  if (match) {
    const head = match[1];
    return `${head}${replacement}, `;
  }
  // No separator at all; replace entire content.
  return `${replacement}, `;
}
