"use client";

import { useTransition } from "react";
import { hideVariation, approveVariation } from "@/lib/actions/admin";

interface AdminVariationActionsProps {
  variationId: string;
  currentStatus: string;
}

export function AdminVariationActions({ variationId, currentStatus }: AdminVariationActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleHide() {
    startTransition(async () => {
      await hideVariation(variationId, "Raporlar incelendi");
    });
  }

  function handleApprove() {
    startTransition(async () => {
      await approveVariation(variationId);
    });
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== "HIDDEN" && (
        <button
          onClick={handleHide}
          disabled={isPending}
          className="rounded-lg bg-error/10 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
        >
          Gizle
        </button>
      )}
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="rounded-lg bg-accent-green/15 px-3 py-1.5 text-xs font-medium text-accent-green transition-colors hover:bg-accent-green/25 disabled:opacity-50"
      >
        Onayla
      </button>
    </div>
  );
}
