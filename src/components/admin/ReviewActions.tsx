"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { approveVariation, hideVariation } from "@/lib/actions/admin";

interface ReviewActionsProps {
  variationId: string;
  recipeSlug: string;
}

/**
 * Per-variation approve/hide buttons for the review queue. Actions already
 * exist in `lib/actions/admin.ts`, this component just wires them up with
 * a pending state and a lightweight "why are you hiding" prompt.
 */
export function ReviewActions({ variationId }: ReviewActionsProps) {
  const t = useTranslations("admin.actions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await approveVariation(variationId);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t("actionFailed"));
      }
    });
  };

  const handleHide = () => {
    setError(null);
    const reason = window.prompt(t("promptHideReason"), "");
    if (reason === null) return; // cancelled
    startTransition(async () => {
      try {
        await hideVariation(variationId, reason.trim() || undefined);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t("actionFailed"));
      }
    });
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="rounded-lg bg-accent-green px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-green/90 disabled:opacity-50"
        >
          {t("approve")}
        </button>
        <button
          type="button"
          onClick={handleHide}
          disabled={isPending}
          className="rounded-lg bg-error px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
        >
          {t("hide")}
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
