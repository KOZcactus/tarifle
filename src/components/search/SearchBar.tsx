"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";

/**
 * Normalize for Turkish-aware fuzzy matching.
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

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  /** Pre-fetched suggestions for autocomplete. */
  suggestions?: { recipes: string[]; ingredients: string[] };
}

export function SearchBar({
  placeholder = "Yemek çeşidi, malzeme veya kategori ara...",
  className = "",
  suggestions,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions by query
  const filtered = (() => {
    if (!suggestions || !query.trim() || query.trim().length < 2) return [];
    const q = trNormalize(query.trim());
    const results: { label: string; type: "tarif" | "malzeme" }[] = [];

    // Recipe titles first (max 4)
    for (const title of suggestions.recipes) {
      if (results.length >= 4) break;
      if (trNormalize(title).includes(q)) {
        results.push({ label: title, type: "tarif" });
      }
    }

    // Ingredients (max 3)
    let ingCount = 0;
    for (const name of suggestions.ingredients) {
      if (ingCount >= 3) break;
      if (trNormalize(name).includes(q)) {
        results.push({ label: name, type: "malzeme" });
        ingCount++;
      }
    }

    return results;
  })();

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setShowSuggestions(value.trim().length >= 2);
      setSelectedIdx(-1);

      if (debounceTimer) clearTimeout(debounceTimer);

      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) {
          params.set("q", value.trim());
        } else {
          params.delete("q");
        }
        params.delete("page");
        router.push(`/tarifler?${params.toString()}`);
      }, SEARCH_DEBOUNCE_MS);

      setDebounceTimer(timer);
    },
    [router, searchParams, debounceTimer],
  );

  function selectSuggestion(label: string) {
    setQuery(label);
    setShowSuggestions(false);
    setSelectedIdx(-1);

    // Navigate immediately
    if (debounceTimer) clearTimeout(debounceTimer);
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", label);
    params.delete("page");
    router.push(`/tarifler?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1,
      );
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      selectSuggestion(filtered[selectedIdx]!.label);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIdx(-1);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <SearchIcon />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.trim().length >= 2) setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-border bg-bg-card pl-11 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label="Tarif ara"
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions && filtered.length > 0}
        aria-autocomplete="list"
      />

      {/* Autocomplete dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-bg-card shadow-lg"
          role="listbox"
        >
          {filtered.map((item, idx) => (
            <li
              key={`${item.type}-${item.label}`}
              role="option"
              aria-selected={idx === selectedIdx}
              className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                idx === selectedIdx
                  ? "bg-primary/10 text-primary"
                  : "text-text hover:bg-bg-elevated"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(item.label);
              }}
            >
              <span className="text-[10px] text-text-muted">
                {item.type === "tarif" ? "📖" : "🥕"}
              </span>
              <span>{item.label}</span>
              <span className="ml-auto text-[10px] text-text-muted">
                {item.type === "tarif" ? "tarif" : "malzeme"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {query && (
        <button
          onClick={() => handleSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted hover:text-text"
          aria-label="Aramayı temizle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
