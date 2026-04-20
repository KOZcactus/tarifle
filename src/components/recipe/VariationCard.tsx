"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ReportButton } from "@/components/recipe/ReportButton";
import { DeleteOwnVariationButton } from "@/components/recipe/DeleteOwnVariationButton";
import { LikeButton } from "@/components/recipe/LikeButton";
import { hideVariation } from "@/lib/actions/admin";
import {
  formatIngredient,
  normaliseIngredients,
} from "@/lib/ingredients";

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
  /** True when the signed-in user authored this uyarlama, shows "Sil". */
  isOwnVariation?: boolean;
  /** Has the current user already liked this variation? */
  isLikedByUser?: boolean;
  /** Recipe slug, needed by LikeButton's revalidatePath after toggle. */
  recipeSlug: string;
}

export function VariationCard({
  variation,
  isModerator,
  isOwnVariation = false,
  isLikedByUser = false,
  recipeSlug,
}: VariationCardProps) {
  const router = useRouter();
  const t = useTranslations("variations");
  const tCard = useTranslations("variations.card");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ingredients = normaliseIngredients(variation.ingredients).map(
    formatIngredient,
  );
  const steps = Array.isArray(variation.steps)
    ? (variation.steps as unknown[]).map(String)
    : [];

  const handleHide = () => {
    setError(null);
    const reason = window.prompt(tCard("hidePromptLabel"), "");
    if (reason === null) return;
    startTransition(async () => {
      try {
        await hideVariation(variation.id, reason.trim() || undefined);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : tCard("errorDefault"));
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
      {/* Header row */}
      <div className="flex items-start gap-4 px-5 py-4">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={`variation-${variation.id}-body`}
          className="min-w-0 flex-1 text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <h3 className="font-medium text-text">{variation.miniTitle}</h3>
          {variation.description && (
            <p className="mt-1 text-sm text-text-muted">
              {variation.description}
            </p>
          )}
          <p className="mt-2 text-xs text-text-muted">
            @{variation.author.username ?? t("anonymousAuthor")}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
            {tCard("metaSummary", {
              ingredients: ingredients.length,
              steps: steps.length,
            })}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200"
              style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▾
            </span>
          </p>
        </button>
        <div className="shrink-0">
          <LikeButton
            variationId={variation.id}
            recipePath={`/tarif/${recipeSlug}`}
            initialLikeCount={variation.likeCount}
            initialLiked={isLikedByUser}
            isOwnVariation={isOwnVariation}
          />
        </div>
      </div>

      {/* Expanded body */}
      {isOpen && (
        <div
          id={`variation-${variation.id}-body`}
          className="border-t border-border bg-bg-elevated/30 px-5 py-4 text-sm"
        >
          <div className="space-y-4">
            {ingredients.length > 0 && (
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {tCard("expandedIngredientsLabel")}
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
                  {tCard("expandedStepsLabel")}
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
                  {tCard("expandedNotesLabel")}
                </h4>
                <p className="whitespace-pre-line text-text">{variation.notes}</p>
              </section>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-3">
            <Link
              href={`/uyarlama/${variation.id}`}
              className="text-xs font-medium text-text-muted transition-colors hover:text-primary"
              title={tCard("permalinkTitleAttr")}
            >
              🔗 {tCard("permalinkLabel")}
            </Link>
            {isOwnVariation && (
              <DeleteOwnVariationButton
                variationId={variation.id}
                miniTitle={variation.miniTitle}
              />
            )}
            {isModerator && !isOwnVariation && (
              <button
                type="button"
                onClick={handleHide}
                disabled={isPending}
                className="text-xs font-medium text-error transition-colors hover:underline disabled:opacity-50"
                title={tCard("hideTitleAttr")}
              >
                {isPending ? tCard("hidingAction") : tCard("hideAction")}
              </button>
            )}
            {!isOwnVariation && <ReportButton targetType="VARIATION" targetId={variation.id} />}
          </div>
          {error && <p className="mt-2 text-right text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
