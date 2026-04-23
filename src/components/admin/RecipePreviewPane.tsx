"use client";

import { useTranslations } from "next-intl";

interface PreviewIngredient {
  name: string;
  amount: string;
  unit: string;
}

interface PreviewStep {
  instruction: string;
  timerSeconds: number | null;
}

interface Props {
  ingredients: PreviewIngredient[];
  steps: PreviewStep[];
  tipNote: string;
  servingSuggestion: string;
  title: string;
}

function formatTimer(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} sn`;
  if (s === 0) return `${m} dk`;
  return `${m} dk ${s} sn`;
}

/**
 * Read-only real-time preview of the admin edit form. Mirrors the public
 * recipe page layout (ingredient list, numbered steps, tip note, serving
 * suggestion) using the current draft state; updates every keystroke.
 * Stays sticky at the top of its column so the editor and preview scroll
 * together on tall recipes.
 */
export function RecipePreviewPane({
  ingredients,
  steps,
  tipNote,
  servingSuggestion,
  title,
}: Props) {
  const t = useTranslations("admin.contentEdit.preview");

  const hasIngredients = ingredients.some((i) => i.name.trim());
  const hasSteps = steps.some((s) => s.instruction.trim());
  const hasTip = tipNote.trim().length > 0;
  const hasServing = servingSuggestion.trim().length > 0;
  const isEmpty = !hasIngredients && !hasSteps && !hasTip && !hasServing;

  return (
    <aside
      aria-label={t("heading")}
      className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-border bg-bg-card p-4"
    >
      <header className="mb-3 border-b border-border pb-2">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {t("heading")}
        </p>
        <h2 className="mt-0.5 text-lg font-semibold text-text">
          {title || t("untitled")}
        </h2>
        <p className="mt-1 text-xs text-text-muted">{t("hint")}</p>
      </header>

      {isEmpty && (
        <p className="rounded border border-dashed border-border p-3 text-center text-xs text-text-muted">
          {t("empty")}
        </p>
      )}

      {hasIngredients && (
        <section className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-text">
            {t("ingredientsHeading")}
          </h3>
          <ul className="space-y-1 text-sm">
            {ingredients.map((i, idx) =>
              i.name.trim() ? (
                <li key={idx} className="flex items-baseline gap-2">
                  <span className="tabular-nums text-text-muted">
                    {i.amount.trim() || "•"}
                    {i.unit.trim() && ` ${i.unit.trim()}`}
                  </span>
                  <span className="text-text">{i.name.trim()}</span>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {hasSteps && (
        <section className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-text">
            {t("stepsHeading")}
          </h3>
          <ol className="space-y-2 text-sm">
            {steps.map((s, idx) =>
              s.instruction.trim() ? (
                <li key={idx} className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-text">{s.instruction.trim()}</p>
                    {formatTimer(s.timerSeconds) && (
                      <span className="mt-0.5 inline-block rounded bg-surface-muted/60 px-1.5 py-0.5 text-xs text-text-muted">
                        ⏱ {formatTimer(s.timerSeconds)}
                      </span>
                    )}
                  </div>
                </li>
              ) : null,
            )}
          </ol>
        </section>
      )}

      {hasTip && (
        <section className="mb-4">
          <h3 className="mb-1 text-sm font-semibold text-text">
            {t("tipNoteHeading")}
          </h3>
          <p className="text-sm italic text-text-muted">{tipNote.trim()}</p>
        </section>
      )}

      {hasServing && (
        <section className="mb-2">
          <h3 className="mb-1 text-sm font-semibold text-text">
            {t("servingHeading")}
          </h3>
          <p className="text-sm italic text-text-muted">
            {servingSuggestion.trim()}
          </p>
        </section>
      )}
    </aside>
  );
}
