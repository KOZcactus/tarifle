"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateRecipeContentAction } from "@/lib/actions/admin";

interface IngredientDraft {
  name: string;
  amount: string;
  unit: string;
}

interface StepDraft {
  instruction: string;
  timerSeconds: number | null;
}

interface Props {
  recipeId: string;
  slug: string;
  title: string;
  initialIngredients: Array<{ name: string; amount: string; unit: string | null }>;
  initialSteps: Array<{ instruction: string; timerSeconds: number | null }>;
  initialTipNote: string | null;
  initialServingSuggestion: string | null;
}

const MAX_INGREDIENTS = 40;
const MAX_STEPS = 15;
const MAX_NAME = 200;
const MAX_AMOUNT = 50;
const MAX_UNIT = 50;
const MAX_INSTRUCTION = 2000;
const MAX_NOTE = 500;

function toIngredientDrafts(
  list: Array<{ name: string; amount: string; unit: string | null }>,
): IngredientDraft[] {
  return list.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit ?? "" }));
}

function toStepDrafts(
  list: Array<{ instruction: string; timerSeconds: number | null }>,
): StepDraft[] {
  return list.map((s) => ({ instruction: s.instruction, timerSeconds: s.timerSeconds }));
}

export function RecipeContentEditForm({
  recipeId,
  slug,
  title,
  initialIngredients,
  initialSteps,
  initialTipNote,
  initialServingSuggestion,
}: Props) {
  const t = useTranslations("admin.contentEdit");
  const router = useRouter();
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    toIngredientDrafts(initialIngredients),
  );
  const [steps, setSteps] = useState<StepDraft[]>(toStepDrafts(initialSteps));
  const [tipNote, setTipNote] = useState<string>(initialTipNote ?? "");
  const [servingSuggestion, setServingSuggestion] = useState<string>(
    initialServingSuggestion ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function updateIngredient(idx: number, field: keyof IngredientDraft, value: string) {
    setIngredients((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, [field]: value };
      return next;
    });
    setSaved(false);
  }

  function addIngredient() {
    if (ingredients.length >= MAX_INGREDIENTS) return;
    setIngredients((prev) => [...prev, { name: "", amount: "", unit: "" }]);
    setSaved(false);
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function moveIngredient(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= ingredients.length) return;
    setIngredients((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
    setSaved(false);
  }

  function updateStep(idx: number, field: keyof StepDraft, value: string) {
    setSteps((prev) => {
      const next = [...prev];
      if (field === "timerSeconds") {
        const trimmed = value.trim();
        next[idx] = {
          ...next[idx]!,
          timerSeconds: trimmed === "" ? null : Math.max(0, Number(trimmed) || 0),
        };
      } else {
        next[idx] = { ...next[idx]!, instruction: value };
      }
      return next;
    });
    setSaved(false);
  }

  function addStep() {
    if (steps.length >= MAX_STEPS) return;
    setSteps((prev) => [...prev, { instruction: "", timerSeconds: null }]);
    setSaved(false);
  }

  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function moveStep(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
    setSaved(false);
  }

  function validateLocal(): string | null {
    if (ingredients.length === 0) return t("errorNoIngredient");
    if (steps.length === 0) return t("errorNoStep");
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i]!;
      if (!ing.name.trim()) return t("errorIngredientName", { n: i + 1 });
      if (!ing.amount.trim()) return t("errorIngredientAmount", { n: i + 1 });
    }
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i]!.instruction.trim()) return t("errorStepEmpty", { n: i + 1 });
    }
    const hasEmDash = (s: string) => s.includes("\u2014") || s.includes("\u2013");
    for (const ing of ingredients) {
      if (hasEmDash(ing.name) || hasEmDash(ing.amount) || hasEmDash(ing.unit)) {
        return t("errorEmDash");
      }
    }
    for (const s of steps) {
      if (hasEmDash(s.instruction)) return t("errorEmDash");
    }
    if (hasEmDash(tipNote) || hasEmDash(servingSuggestion)) return t("errorEmDash");
    return null;
  }

  function onSubmit() {
    setError(null);
    setSaved(false);
    const localErr = validateLocal();
    if (localErr) {
      setError(localErr);
      return;
    }
    startTransition(async () => {
      const res = await updateRecipeContentAction({
        recipeId,
        ingredients: ingredients.map((i, idx) => ({
          sortOrder: idx + 1,
          name: i.name.trim(),
          amount: i.amount.trim(),
          unit: i.unit.trim() || undefined,
        })),
        steps: steps.map((s, idx) => ({
          stepNumber: idx + 1,
          instruction: s.instruction.trim(),
          timerSeconds: s.timerSeconds ?? undefined,
        })),
        tipNote: tipNote.trim() || undefined,
        servingSuggestion: servingSuggestion.trim() || undefined,
      });
      if (res.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? t("errorSaveFailed"));
      }
    });
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-4">
        <p className="text-sm text-text-muted">{t("editingLabel")}</p>
        <h1 className="text-2xl font-semibold text-text">
          {title} <span className="text-base font-normal text-text-muted">({slug})</span>
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t("helpText")}</p>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-text">
            {t("ingredientsHeading")}{" "}
            <span className="text-sm font-normal text-text-muted">
              ({ingredients.length}/{MAX_INGREDIENTS})
            </span>
          </h2>
          <button
            type="button"
            onClick={addIngredient}
            disabled={ingredients.length >= MAX_INGREDIENTS || pending}
            className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t("addIngredient")}
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-bg-card p-2"
            >
              <span className="w-6 text-center text-xs text-text-muted">{idx + 1}</span>
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                placeholder={t("ingredientNamePlaceholder")}
                maxLength={MAX_NAME}
                className="rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
                aria-label={t("ingredientNameLabel", { n: idx + 1 })}
              />
              <input
                type="text"
                value={ing.amount}
                onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                placeholder={t("ingredientAmountPlaceholder")}
                maxLength={MAX_AMOUNT}
                className="rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
                aria-label={t("ingredientAmountLabel", { n: idx + 1 })}
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                placeholder={t("ingredientUnitPlaceholder")}
                maxLength={MAX_UNIT}
                className="rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
                aria-label={t("ingredientUnitLabel", { n: idx + 1 })}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveIngredient(idx, -1)}
                  disabled={idx === 0 || pending}
                  className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-bg-elevated disabled:opacity-30"
                  aria-label={t("moveUp")}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveIngredient(idx, 1)}
                  disabled={idx === ingredients.length - 1 || pending}
                  className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-bg-elevated disabled:opacity-30"
                  aria-label={t("moveDown")}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  disabled={pending}
                  className="rounded border border-error/30 px-2 py-1 text-xs text-error hover:bg-error/10 disabled:opacity-30"
                  aria-label={t("remove")}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-text">
            {t("stepsHeading")}{" "}
            <span className="text-sm font-normal text-text-muted">
              ({steps.length}/{MAX_STEPS})
            </span>
          </h2>
          <button
            type="button"
            onClick={addStep}
            disabled={steps.length >= MAX_STEPS || pending}
            className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t("addStep")}
          </button>
        </div>
        <div className="space-y-2">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-bg-card p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-text-muted">
                  {t("stepLabel", { n: idx + 1 })}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0 || pending}
                    className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-bg-elevated disabled:opacity-30"
                    aria-label={t("moveUp")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1 || pending}
                    className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-bg-elevated disabled:opacity-30"
                    aria-label={t("moveDown")}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    disabled={pending}
                    className="rounded border border-error/30 px-2 py-1 text-xs text-error hover:bg-error/10 disabled:opacity-30"
                    aria-label={t("remove")}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <textarea
                value={s.instruction}
                onChange={(e) => updateStep(idx, "instruction", e.target.value)}
                placeholder={t("stepInstructionPlaceholder")}
                maxLength={MAX_INSTRUCTION}
                rows={3}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                aria-label={t("stepInstructionLabel", { n: idx + 1 })}
              />
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <label className="text-text-muted" htmlFor={`timer-${idx}`}>
                  {t("stepTimerLabel")}
                </label>
                <input
                  id={`timer-${idx}`}
                  type="number"
                  min={0}
                  step={1}
                  value={s.timerSeconds ?? ""}
                  onChange={(e) => updateStep(idx, "timerSeconds", e.target.value)}
                  placeholder="0"
                  className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
                />
                <span className="text-text-muted">{t("stepTimerHint")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <label className="block" htmlFor="tipNote-field">
          <span className="text-lg font-semibold text-text">{t("tipNoteHeading")}</span>
          <span className="ml-2 text-sm text-text-muted">{t("tipNoteHint")}</span>
        </label>
        <textarea
          id="tipNote-field"
          value={tipNote}
          onChange={(e) => {
            setTipNote(e.target.value);
            setSaved(false);
          }}
          placeholder={t("tipNotePlaceholder")}
          maxLength={MAX_NOTE}
          rows={3}
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="text-xs text-text-muted">
          {tipNote.length}/{MAX_NOTE}
        </p>
      </section>

      <section className="space-y-3">
        <label className="block" htmlFor="serv-field">
          <span className="text-lg font-semibold text-text">
            {t("servingSuggestionHeading")}
          </span>
          <span className="ml-2 text-sm text-text-muted">{t("servingSuggestionHint")}</span>
        </label>
        <textarea
          id="serv-field"
          value={servingSuggestion}
          onChange={(e) => {
            setServingSuggestion(e.target.value);
            setSaved(false);
          }}
          placeholder={t("servingSuggestionPlaceholder")}
          maxLength={MAX_NOTE}
          rows={3}
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="text-xs text-text-muted">
          {servingSuggestion.length}/{MAX_NOTE}
        </p>
      </section>

      <footer className="sticky bottom-0 -mx-4 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            {error && <span className="text-error">{error}</span>}
            {saved && !error && (
              <span className="text-accent-green">{t("saveSuccess")}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? t("saving") : t("saveAll")}
          </button>
        </div>
      </footer>
    </div>
  );
}
