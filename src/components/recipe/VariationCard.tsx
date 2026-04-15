"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  /** True when the signed-in user authored this uyarlama — shows "Sil". */
  isOwnVariation?: boolean;
  /** Has the current user already liked this variation? */
  isLikedByUser?: boolean;
  /** Recipe slug — needed by LikeButton's revalidatePath after toggle. */
  recipeSlug: string;
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
export function VariationCard({
  variation,
  isModerator,
  isOwnVariation = false,
  isLikedByUser = false,
  recipeSlug,
}: VariationCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Accept both the legacy `string[]` shape and the new
  // `{amount, unit, name}[]` — normalise both into display strings so the
  // accordion body doesn't care which format was stored.
  const ingredients = normaliseIngredients(variation.ingredients).map(
    formatIngredient,
  );
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
    <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
      {/* Header row — flex container. Sol taraf expand button, sağ taraf
          LikeButton (interactive sibling). nested-interactive a11y kuralı
          için button içinde button yapmıyoruz — LikeButton parent flex
          row'un kardeşi. */}
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
            @{variation.author.username ?? "anonim"}
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
            {ingredients.length} malzeme · {steps.length} adım
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

      {/* Expanded body — only mounted when open so closed cards stay light. */}
      {isOpen && (
        <div
          id={`variation-${variation.id}-body`}
          className="border-t border-border bg-bg-elevated/30 px-5 py-4 text-sm"
        >
          <div className="space-y-4">
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

          {/* Action footer — only when expanded. Report+Gizle+Sil yalnizca
              icerik aciklanmis durumda mantikli. Author'un "Sil"i moderator
              "Gizle"sinden ayri bir aksiyon: hard delete vs soft-hide. */}
          <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-3">
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
                title="Bu uyarlamayı gizle (sadece moderasyon)"
              >
                {isPending ? "Gizleniyor…" : "Gizle"}
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
