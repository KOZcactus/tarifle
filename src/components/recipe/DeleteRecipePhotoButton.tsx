"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteRecipePhotoAction } from "@/lib/actions/recipe-photo";

interface DeleteRecipePhotoButtonProps {
  photoId: string;
}

/** Küçük "×" silme butonu — hover sırasında grid kartında belirir. */
export function DeleteRecipePhotoButton({ photoId }: DeleteRecipePhotoButtonProps) {
  const t = useTranslations("recipe.userPhotos");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      await deleteRecipePhotoAction(photoId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={t("deleteAria")}
      title={t("deleteAria")}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-bg/90 text-sm text-error shadow transition-colors hover:bg-error hover:text-white disabled:opacity-60"
    >
      {isPending ? "…" : "×"}
    </button>
  );
}
