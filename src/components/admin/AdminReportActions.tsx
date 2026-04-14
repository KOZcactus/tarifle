"use client";

import { useTransition } from "react";
import { reviewReport } from "@/lib/actions/admin";

interface AdminReportActionsProps {
  reportId: string;
}

export function AdminReportActions({ reportId }: AdminReportActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleAction(action: "REVIEWED" | "DISMISSED") {
    startTransition(async () => {
      await reviewReport(reportId, action);
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("REVIEWED")}
        disabled={isPending}
        className="rounded-lg bg-accent-green/15 px-3 py-1.5 text-xs font-medium text-accent-green transition-colors hover:bg-accent-green/25 disabled:opacity-50"
      >
        İncelendi
      </button>
      <button
        onClick={() => handleAction("DISMISSED")}
        disabled={isPending}
        className="rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-border disabled:opacity-50"
      >
        Reddet
      </button>
    </div>
  );
}
