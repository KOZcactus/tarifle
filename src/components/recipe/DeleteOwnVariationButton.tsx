"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteOwnVariationAction } from "@/lib/actions/variation";

interface DeleteOwnVariationButtonProps {
  variationId: string;
  /** Used in the confirm prompt so the user is sure about which one they're removing. */
  miniTitle: string;
  /** Visual density: "inline" for action footers, "compact" for profile list rows. */
  variant?: "inline" | "compact";
}

/**
 * "Sil" button for the current user's own uyarlama. Hard delete on confirm,
 * the server action verifies ownership. A misclick risk is mitigated by a
 * native `window.confirm` that echoes the variation title; no modal
 * dependency (we don't need focus-trap for a single-yes/no prompt).
 *
 * Why hard delete (not soft): the main use case is "yanlislikla ekledim",
 * where the user genuinely wants the row gone. Admin moderation tools stay
 * on the soft-delete path (status: HIDDEN) so audit remains intact for
 * reports; author self-delete is a different concern.
 */
export function DeleteOwnVariationButton({
  variationId,
  miniTitle,
  variant = "inline",
}: DeleteOwnVariationButtonProps) {
  const router = useRouter();
  const t = useTranslations("deleteVariation");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const ok = window.confirm(t("confirm", { title: miniTitle }));
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteOwnVariationAction(variationId);
      if (!result.success) {
        setError(result.error ?? t("errorDefault"));
        return;
      }
      router.refresh();
    });
  };

  const base =
    "font-medium text-error transition-colors hover:underline disabled:opacity-50";
  const sizeClasses =
    variant === "compact" ? "text-[11px]" : "text-xs";

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`${base} ${sizeClasses}`}
        title={t("titleAttr")}
        aria-label={t("ariaLabel", { title: miniTitle })}
      >
        {isPending ? t("pending") : t("button")}
      </button>
      {error && (
        <span className="text-[11px] text-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
