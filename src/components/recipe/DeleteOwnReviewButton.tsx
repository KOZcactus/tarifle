"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteOwnReviewAction } from "@/lib/actions/review";

export function DeleteOwnReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Yorumunu silmek istediğine emin misin?")) return;
    startTransition(async () => {
      const res = await deleteOwnReviewAction(reviewId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error ?? "Silinemedi.");
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
      {pending ? "Siliniyor..." : "Sil"}
    </button>
  );
}
