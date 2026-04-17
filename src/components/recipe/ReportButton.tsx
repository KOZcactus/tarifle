"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createReport } from "@/lib/actions/report";

interface ReportButtonProps {
  targetType: "VARIATION" | "REVIEW";
  targetId: string;
  /** Accessible label override — defaults to namespace-derived label. */
  label?: string;
}

const REASON_VALUES = ["SPAM", "PROFANITY", "MISLEADING", "HARMFUL", "OTHER"] as const;

export function ReportButton({
  targetType,
  targetId,
  label,
}: ReportButtonProps) {
  const t = useTranslations("reports");
  const ariaLabel =
    label ??
    (targetType === "REVIEW"
      ? t("buttonAriaReview")
      : t("buttonAriaVariation"));
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  if (success) {
    return (
      <span className="text-xs text-accent-green">{t("successBadge")}</span>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          if (!session?.user) {
            router.push("/giris");
            return;
          }
          setIsOpen(true);
        }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        className="text-xs text-text-muted transition-colors hover:text-error focus-visible:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
        title={t("buttonTitle")}
      >
        <FlagIcon />
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("targetType", targetType);
    formData.set("targetId", targetId);

    startTransition(async () => {
      const result = await createReport(formData);
      if (result.success) {
        setSuccess(true);
        setIsOpen(false);
      } else {
        setError(result.error || t("errorDefault"));
      }
    });
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-bg p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-text">{t("formTitle")}</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-text-muted hover:text-text"
        >
          {t("cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}

        <select
          name="reason"
          required
          autoFocus
          aria-label={t("selectAria")}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          defaultValue=""
        >
          <option value="" disabled>{t("selectPlaceholder")}</option>
          {REASON_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`reasons.${value}`)}
            </option>
          ))}
        </select>

        <textarea
          name="description"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={t("descriptionPlaceholder")}
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-error px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
        >
          {isPending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}

function FlagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  );
}
