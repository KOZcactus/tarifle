"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveReview, hideReview } from "@/lib/actions/admin";

interface ReviewModerationActionsProps {
  reviewId: string;
}

/**
 * Approve/hide buttons for the admin review queue. Mirrors the variation
 * `ReviewActions` component so moderators get the same muscle memory across
 * surfaces. Kept in its own file because admin/ReviewActions.tsx is already
 * the variation version — naming would collide.
 */
export function ReviewModerationActions({
  reviewId,
}: ReviewModerationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await approveReview(reviewId);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "İşlem başarısız.");
      }
    });
  };

  const handleHide = () => {
    setError(null);
    const reason = window.prompt(
      "İsteğe bağlı: gizleme sebebini not et (yazara bildirilir).",
      "",
    );
    if (reason === null) return;
    startTransition(async () => {
      try {
        await hideReview(reviewId, reason.trim() || undefined);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "İşlem başarısız.");
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
          Onayla
        </button>
        <button
          type="button"
          onClick={handleHide}
          disabled={isPending}
          className="rounded-lg bg-error px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
        >
          Gizle
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
