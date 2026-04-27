"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createVariation } from "@/lib/actions/variation";
import { IngredientRowsInput } from "@/components/recipe/IngredientRowsInput";

interface VariationFormProps {
  recipeId: string;
  recipeSlug: string;
}

export function VariationForm({ recipeId, recipeSlug }: VariationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("variations");
  const tForm = useTranslations("variations.form");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  if (!session?.user) {
    return (
      <button
        onClick={() =>
          router.push(
            `/giris?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
          )
        }
        className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-primary hover:text-primary"
      >
        {t("loginCta")}
      </button>
    );
  }

  if (success) {
    return pendingReview ? (
      <div className="rounded-lg bg-accent-blue/10 px-4 py-3 text-sm text-accent-blue">
        {t("successPending")}
      </div>
    ) : (
      <div className="rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
        {t("successPublished")}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        {t("openButton")}
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("recipeId", recipeId);
    formData.set("recipeSlug", recipeSlug);

    startTransition(async () => {
      const result = await createVariation(formData);
      if (result.success) {
        setPendingReview(result.pending === true);
        setSuccess(true);
        setIsOpen(false);
      } else {
        setError(result.error || tForm("errorDefault"));
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-text">{tForm("title")}</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm text-text-muted hover:text-text"
        >
          {tForm("cancel")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div>
          <label htmlFor="miniTitle" className="mb-1.5 block text-sm font-medium text-text">
            {tForm("miniTitleLabel")}
          </label>
          <input
            id="miniTitle"
            name="miniTitle"
            type="text"
            required
            autoFocus
            maxLength={200}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={tForm("miniTitlePlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text">
            {tForm("descriptionLabel")}
          </label>
          <input
            id="description"
            name="description"
            type="text"
            maxLength={300}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={tForm("descriptionPlaceholder")}
          />
          <p className="mt-1 text-xs text-text-muted">{tForm("descriptionMaxNote")}</p>
        </div>

        <div>
          <p className="mb-1.5 block text-sm font-medium text-text">
            {tForm("ingredientsLabel")} <span className="text-text-muted">{tForm("ingredientsRequired")}</span>
          </p>
          <p className="mb-2 text-xs text-text-muted">{tForm("ingredientsHelp")}</p>
          <IngredientRowsInput name="ingredients" />
        </div>

        <div>
          <label htmlFor="steps" className="mb-1.5 block text-sm font-medium text-text">
            {tForm("stepsLabel")}{" "}
            <span className="font-normal text-text-muted">{tForm("stepsLabelHint")}</span>
          </label>
          <textarea
            id="steps"
            name="steps"
            required
            rows={4}
            maxLength={15000}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={tForm("stepsPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text">
            {tForm("notesLabel")}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={tForm("notesPlaceholder")}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? tForm("submitting") : tForm("submit")}
        </button>
      </form>
    </div>
  );
}
