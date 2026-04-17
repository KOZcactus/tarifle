"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteOwnReviewAction } from "@/lib/actions/review";

export function DeleteOwnReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const t = useTranslations("reviews.delete");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(t("confirm"))) return;
    startTransition(async () => {
      const res = await deleteOwnReviewAction(reviewId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error ?? t("error"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {pending ? t("pending") : t("button")}
    </button>
  );
}
