"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "@/lib/actions/review";
import { StarRating } from "./StarRating";

interface ReviewFormProps {
  recipeId: string;
  existing?: { rating: number; comment: string | null } | null;
}

export function ReviewForm({ recipeId, existing }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!existing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Lütfen 1-5 arası bir yıldız seç.");
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
        setError(result.error ?? "Bir hata oluştu.");
        setSubmitting(false);
        return;
      }
      if (result.pendingReview) {
        // Preflight caught something (caps, repeated chars, URL). Tell the
        // user their review is queued for moderation rather than silently
        // hiding it from the list after refresh.
        setPendingNotice(
          "Yorumun incelemeye alındı; moderasyon onayından sonra yayınlanacak.",
        );
      }
      // Server action revalidated the path; client refresh pulls new list.
      router.refresh();
      // Re-enable the button so the user can edit again after the RSC
      // re-renders the form in edit mode. Without this, `submitting` stays
      // true for the whole component lifetime and the button is stuck on
      // "Gönderiliyor...".
      setSubmitting(false);
    } catch {
      setError("Yorum gönderilemedi, tekrar dene.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-gray-900"
    >
      <h3 className="mb-3 text-base font-semibold">
        {isEditing ? "Yorumunu düzenle" : "Bu tarife yorum bırak"}
      </h3>

      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Puan:
        </span>
        <StarRating
          value={rating}
          interactive
          onChange={setRating}
          size="lg"
          ariaLabel="Yıldız seç"
        />
        {rating > 0 && (
          <span className="text-sm font-medium">{rating}/5</span>
        )}
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">
          Yorum (opsiyonel, 10-800 karakter)
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={800}
          rows={4}
          placeholder="Tarifte neyi sevdin, neyi değiştirirdin?"
          className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-white/10"
        />
        <span className="text-xs text-gray-500">
          {comment.length}/800
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
        {submitting ? "Gönderiliyor..." : isEditing ? "Güncelle" : "Gönder"}
      </button>
    </form>
  );
}
