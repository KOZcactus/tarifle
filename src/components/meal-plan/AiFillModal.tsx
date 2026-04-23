"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  generateWeeklyMenuAction,
  applyWeeklyMenuAction,
} from "@/lib/actions/menu";
import type {
  MenuSlot,
  WeeklyMenuResponse,
} from "@/lib/ai/types";

type View = "form" | "preview";

interface AiFillModalProps {
  /** 7 day labels (Mon..Sun) pre-localized from server. */
  dayLabels: readonly [string, string, string, string, string, string, string];
  /** Meal labels localized (breakfast/lunch/dinner). */
  mealLabels: { BREAKFAST: string; LUNCH: string; DINNER: string };
}

const DIET_OPTIONS = [
  { slug: "", labelKey: "dietAny" },
  { slug: "vegan", labelKey: "dietVegan" },
  { slug: "vejetaryen", labelKey: "dietVegetarian" },
  { slug: "glutensiz", labelKey: "dietGlutenFree" },
  { slug: "sutsuz", labelKey: "dietDairyFree" },
  { slug: "alkolsuz", labelKey: "dietAlcoholFree" },
] as const;

function splitCsv(raw: string): string[] {
  return raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function AiFillModal({ dayLabels, mealLabels }: AiFillModalProps) {
  const t = useTranslations("mealPlanner.aiFill");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeeklyMenuResponse | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isApplying, startApply] = useTransition();
  const [replaceExisting, setReplaceExisting] = useState(false);

  const [ingredientsText, setIngredientsText] = useState("");
  const [assumeStaples, setAssumeStaples] = useState(true);
  const [personCount, setPersonCount] = useState<number>(2);
  const [dietSlug, setDietSlug] = useState<string>("");

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  function reset() {
    setView("form");
    setResult(null);
    setError(null);
  }

  function closeDialog() {
    setOpen(false);
    reset();
  }

  function handleGenerate() {
    const ingredients = splitCsv(ingredientsText);
    if (ingredients.length === 0) {
      setError(t("errorNoIngredients"));
      return;
    }
    setError(null);
    startGenerate(async () => {
      const res = await generateWeeklyMenuAction({
        ingredients,
        assumePantryStaples: assumeStaples,
        personCount,
        dietSlug: dietSlug || undefined,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? t("errorGeneric"));
        return;
      }
      setResult(res.data);
      setView("preview");
    });
  }

  function handleApply() {
    if (!result) return;
    const slotsToApply = result.slots
      .filter((s): s is MenuSlot & { recipe: NonNullable<MenuSlot["recipe"]> } =>
        s.recipe !== null,
      )
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        mealType: s.mealType,
        recipeId: s.recipe.recipeId,
      }));
    if (slotsToApply.length === 0) {
      setError(t("errorNoSlots"));
      return;
    }
    startApply(async () => {
      const res = await applyWeeklyMenuAction({
        slots: slotsToApply,
        replace: replaceExisting,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? t("errorApply"));
        return;
      }
      closeDialog();
      router.refresh();
    });
  }

  const slotsByKey = useMemo(() => {
    const map = new Map<string, MenuSlot>();
    if (!result) return map;
    for (const s of result.slots) {
      map.set(`${s.dayOfWeek}-${s.mealType}`, s);
    }
    return map;
  }, [result]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={t("triggerAria")}
      >
        <span aria-hidden>✨</span>
        {t("trigger")}
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-3xl rounded-xl border border-surface-muted bg-surface p-0 shadow-xl backdrop:bg-black/40"
        onClose={closeDialog}
      >
        <div className="flex items-start justify-between border-b border-surface-muted px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-text">
              {view === "form" ? t("formTitle") : t("previewTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {view === "form" ? t("formSubtitle") : t("previewSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded p-1 text-text-muted transition hover:bg-surface-muted hover:text-text"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {view === "form" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="ai-fill-ingredients"
                  className="mb-1 block text-sm font-medium text-text"
                >
                  {t("ingredientsLabel")}
                </label>
                <textarea
                  id="ai-fill-ingredients"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  rows={4}
                  placeholder={t("ingredientsPlaceholder")}
                  className="w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-xs text-text-muted">
                  {t("ingredientsHelp")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ai-fill-person"
                    className="mb-1 block text-sm font-medium text-text"
                  >
                    {t("personCountLabel")}
                  </label>
                  <input
                    id="ai-fill-person"
                    type="number"
                    min={1}
                    max={12}
                    value={personCount}
                    onChange={(e) =>
                      setPersonCount(
                        Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                      )
                    }
                    className="w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ai-fill-diet"
                    className="mb-1 block text-sm font-medium text-text"
                  >
                    {t("dietLabel")}
                  </label>
                  <select
                    id="ai-fill-diet"
                    value={dietSlug}
                    onChange={(e) => setDietSlug(e.target.value)}
                    className="w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  >
                    {DIET_OPTIONS.map((d) => (
                      <option key={d.slug || "any"} value={d.slug}>
                        {t(d.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={assumeStaples}
                  onChange={(e) => setAssumeStaples(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-muted text-primary focus:ring-primary"
                />
                {t("assumeStaplesLabel")}
              </label>

              <div className="flex justify-end gap-2 border-t border-surface-muted pt-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isGenerating}
                  className="rounded-md px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating ? t("generating") : t("generate")}
                </button>
              </div>
            </div>
          )}

          {view === "preview" && result && (
            <div className="space-y-4">
              <div className="rounded-md bg-surface-muted/40 px-3 py-2 text-sm text-text">
                {result.commentary}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-muted text-xs font-medium uppercase tracking-wider text-text-muted">
                      <th className="px-2 py-2"></th>
                      {(["BREAKFAST", "LUNCH", "DINNER"] as const).map((m) => (
                        <th key={m} className="px-2 py-2">
                          {mealLabels[m]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dayLabels.map((dayLabel, dayIdx) => (
                      <tr
                        key={dayIdx}
                        className="border-b border-surface-muted/60 align-top last:border-b-0"
                      >
                        <th
                          scope="row"
                          className="px-2 py-2 text-xs font-medium text-text-muted"
                        >
                          {dayLabel}
                        </th>
                        {(["BREAKFAST", "LUNCH", "DINNER"] as const).map(
                          (meal) => {
                            const slot = slotsByKey.get(`${dayIdx}-${meal}`);
                            if (!slot?.recipe) {
                              return (
                                <td
                                  key={meal}
                                  className="px-2 py-2 text-xs italic text-text-muted"
                                >
                                  {t("slotEmpty")}
                                </td>
                              );
                            }
                            return (
                              <td key={meal} className="px-2 py-2">
                                <div className="text-sm font-medium text-text">
                                  {slot.recipe.emoji && (
                                    <span aria-hidden className="mr-1">
                                      {slot.recipe.emoji}
                                    </span>
                                  )}
                                  {slot.recipe.title}
                                </div>
                                <div className="mt-0.5 text-xs text-text-muted">
                                  {slot.recipe.totalMinutes} dk ·{" "}
                                  {slot.reason}
                                </div>
                              </td>
                            );
                          },
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-muted text-primary focus:ring-primary"
                />
                {t("replaceLabel")}
              </label>

              <div className="flex justify-between gap-2 border-t border-surface-muted pt-4">
                <button
                  type="button"
                  onClick={() => setView("form")}
                  disabled={isApplying}
                  className="rounded-md px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted"
                >
                  {t("back")}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={isApplying}
                    className="rounded-md px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApplying ? t("applying") : t("apply")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
