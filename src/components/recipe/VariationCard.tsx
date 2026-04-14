"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReportButton } from "@/components/recipe/ReportButton";
import { hideVariation } from "@/lib/actions/admin";

interface VariationCardProps {
  variation: {
    id: string;
    miniTitle: string;
    description: string | null;
    ingredients: unknown;
    steps: unknown;
    notes: string | null;
    likeCount: number;
    author: {
      username: string | null;
      name: string | null;
    };
  };
  /** Render moderator-only "Gizle" affordance. */
  isModerator: boolean;
}

/**
 * Variation list item. Collapsed by default — title + description + author +
 * like count + report button. Click anywhere on the summary row to expand
 * and reveal the full ingredient list, steps, and any author notes.
 *
 * Moderators get an inline "Gizle" button so they can pull bad content
 * without clicking through to the admin queue. The hidden state takes
 * effect on the next page render — `router.refresh` triggers it.
 */
export function VariationCard({ variation, isModerator }: VariationCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ingredients = Array.isArray(variation.ingredients)
    ? (variation.ingredients as unknown[]).map(String)
    : [];
  const steps = Array.isArray(variation.steps)
    ? (variation.steps as unknown[]).map(String)
    : [];

  const handleHide = () => {
    setError(null);
    const reason = window.prompt(
      "İsteğe bağlı: gizleme sebebini not et (yazara bildirilir).",
      "",
    );
    if (reason === null) return;
    startTransition(async () => {
      try {
        await hideVariation(variation.id, reason.trim() || undefined);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "İşlem başarısız.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      {/* Summary row — clicking opens the details. We use a button for
          keyboard + screen reader semantics, then layer the visual rows
          inside it. */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={`variation-${variation.id}-body`}
        className="-m-1 block w-full p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-text">{variation.miniTitle}</h3>
            {variation.description && (
              <p className="mt-1 text-sm text-text-muted">
                {variation.description}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm text-text-muted">
            ❤️ {variation.likeCount}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>@{variation.author.username ?? "anonim"}</span>
          <span aria-hidden="true">
            {ingredients.length} malzeme · {steps.length} adım{" "}
            <span className="ml-1 inline-block transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▾
            </span>
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div
          id={`variation-${variation.id}-body`}
          className="mt-4 space-y-4 border-t border-border pt-4 text-sm"
        >
          {ingredients.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Malzemeler
              </h4>
              <ul className="list-inside list-disc space-y-1 text-text">
                {ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </section>
          )}

          {steps.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Yapılış
              </h4>
              <ol className="list-inside list-decimal space-y-1 text-text">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          {variation.notes && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Notlar
              </h4>
              <p className="whitespace-pre-line text-text">{variation.notes}</p>
            </section>
          )}
        </div>
      )}

      {/* Footer actions: report (everyone) + moderator-only hide */}
      <div className="mt-3 flex items-center justify-end gap-3 border-t border-border pt-3">
        {isModerator && (
          <button
            type="button"
            onClick={handleHide}
            disabled={isPending}
            className="text-xs font-medium text-error transition-colors hover:underline disabled:opacity-50"
            title="Bu uyarlamayı gizle (sadece moderasyon)"
          >
            {isPending ? "Gizleniyor…" : "Gizle"}
          </button>
        )}
        <ReportButton targetType="VARIATION" targetId={variation.id} />
      </div>
      {error && <p className="mt-2 text-right text-xs text-error">{error}</p>}
    </div>
  );
}
