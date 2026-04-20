"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { MealType } from "@prisma/client";
import { setMealPlanSlotAction } from "@/lib/actions/meal-plan";

interface RecipeHit {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  totalMinutes: number;
  difficulty: string;
}

interface RecipePickerDialogProps {
  open: boolean;
  onClose: () => void;
  dayOfWeek: number;
  mealType: MealType;
  /** Opsiyonel başlık, "Pazartesi · Öğle yemeği" gibi. */
  slotLabel: string;
}

/**
 * Slot picker modal, kullanıcı tarife arama + seçim yapar. Debounce
 * 250ms; arama `/api/search/recipes` endpoint'ine değil, yeni route
 * `/api/meal-plan/search` kullanabilir. Şu an MVP için mevcut FTS
 * altyapısına doğrudan bağlanacak.
 *
 * Klavye: Escape kapatır, / focus search.
 */
export function RecipePickerDialog({
  open,
  onClose,
  dayOfWeek,
  mealType,
  slotLabel,
}: RecipePickerDialogProps) {
  const t = useTranslations("mealPlanner.picker");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<RecipeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount sonrası input'a fokusla; sonraki query değişiminde arama.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
      setHits([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/meal-plan/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("search_failed");
        const data = (await res.json()) as { recipes: RecipeHit[] };
        setHits(data.recipes);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(t("searchError"));
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, t]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handlePick(recipeId: string) {
    startTransition(async () => {
      const res = await setMealPlanSlotAction({
        recipeId,
        dayOfWeek,
        mealType,
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? t("saveError"));
      }
    });
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogTitle")}
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-bg-card shadow-xl">
        <header className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-text">
                {t("dialogTitle")}
              </h2>
              <p className="text-xs text-text-muted">{slotLabel}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
              aria-label={t("close")}
            >
              ✕
            </button>
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="mt-3 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <p className="p-4 text-center text-sm text-text-muted">
              {t("loading")}
            </p>
          )}
          {!loading && query.trim().length >= 2 && hits.length === 0 && (
            <p className="p-4 text-center text-sm text-text-muted">
              {t("empty")}
            </p>
          )}
          {!loading && query.trim().length < 2 && (
            <p className="p-4 text-center text-xs text-text-muted">
              {t("hint")}
            </p>
          )}
          <ul className="space-y-1">
            {hits.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handlePick(r.id)}
                  disabled={pending}
                  className="flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-bg-elevated disabled:opacity-50"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {r.emoji ?? "🍽️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {r.totalMinutes} dk ·{" "}
                      <Link
                        href={`/tarif/${r.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary"
                      >
                        {t("viewRecipe")}
                      </Link>
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="border-t border-border bg-error/5 p-3 text-xs text-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
