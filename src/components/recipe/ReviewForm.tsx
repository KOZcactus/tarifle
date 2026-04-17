"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { submitReviewAction } from "@/lib/actions/review";
import { StarRating } from "./StarRating";

interface ReviewFormProps {
  recipeId: string;
  existing?: { rating: number; comment: string | null } | null;
}

const MAX_COMMENT = 800;

export function ReviewForm({ recipeId, existing }: ReviewFormProps) {
  const router = useRouter();
  const t = useTranslations("reviews.form");
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!existing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError(t("errorRatingRange"));
      return;
    }
    setError(null);
    setPendingNotice(null);
    setSubmitting(true);
    try {
      const result = await submitReviewAction({
        recipeId,
        rating,
        // Trim + empty → undefined so validator treats "yalnız yıldız" as valid.
        comment: comment.trim().length === 0 ? undefined : comment.trim(),
      });
      if (!result.success) {
        setError(result.error ?? t("errorDefault"));
        setSubmitting(false);
        return;
      }
      if (result.pendingReview) {
        // Preflight caught something (caps, repeated chars, URL). Tell the
        // user their review is queued for moderation rather than silently
        // hiding it from the list after refresh.
        setPendingNotice(t("pendingNotice"));
      }
      router.refresh();
      setSubmitting(false);
    } catch {
      setError(t("errorNetwork"));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-gray-900"
    >
      <h3 className="mb-3 text-base font-semibold">
        {isEditing ? t("titleEdit") : t("titleNew")}
      </h3>

      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t("ratingLabel")}
        </span>
        <StarRating
          value={rating}
          interactive
          onChange={setRating}
          size="lg"
          ariaLabel={t("ratingAria")}
        />
        {rating > 0 && (
          <span className="text-sm font-medium">
            {t("ratingValue", { n: rating })}
          </span>
        )}
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">
          {t("commentLabel")}
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={4}
          placeholder={t("commentPlaceholder")}
          className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-white/10"
        />
        <span className="text-xs text-gray-500">
          {t("commentCounter", { used: comment.length, max: MAX_COMMENT })}
        </span>
      </label>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {pendingNotice && (
        <p
          className="mb-3 text-sm text-amber-700 dark:text-amber-400"
          role="status"
        >
          {pendingNotice}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? t("submitting") : isEditing ? t("submitEdit") : t("submitNew")}
      </button>
    </form>
  );
}
