"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  deleteRecipePhotoAction,
  toggleRecipePhotoVisibilityAction,
} from "@/lib/actions/recipe-photo";

interface AdminPhotoCardProps {
  photoId: string;
  thumbnailUrl: string;
  fullUrl: string;
  caption: string | null;
  status: "VISIBLE" | "HIDDEN";
  recipeTitle: string;
  recipeSlug: string;
  recipeEmoji: string | null;
  authorUsername: string | null;
  authorName: string | null;
  createdAt: string;
}

export function AdminPhotoCard(props: AdminPhotoCardProps) {
  const t = useTranslations("admin.userPhotos");
  const [isPending, startTransition] = useTransition();

  const {
    photoId,
    thumbnailUrl,
    fullUrl,
    caption,
    status,
    recipeTitle,
    recipeSlug,
    recipeEmoji,
    authorUsername,
    authorName,
    createdAt,
  } = props;

  function handleToggle() {
    startTransition(async () => {
      await toggleRecipePhotoVisibilityAction(photoId);
    });
  }

  function handleDelete() {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      await deleteRecipePhotoAction(photoId);
    });
  }

  const authorLabel = authorName ?? authorUsername ?? t("anonymous");
  const isHidden = status === "HIDDEN";

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border bg-bg-card ${
        isHidden ? "border-warning/40 bg-warning/5" : "border-border"
      }`}
    >
      <Link
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-square bg-bg-elevated"
      >
        <img
          src={thumbnailUrl}
          alt={caption ?? t("defaultAlt", { author: authorLabel })}
          loading="lazy"
          className={`h-full w-full object-cover ${isHidden ? "opacity-60" : ""}`}
        />
        {isHidden && (
          <span className="absolute right-2 top-2 rounded-full bg-warning/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {t("statusHidden")}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/tarif/${recipeSlug}`}
          className="truncate text-sm font-semibold text-text hover:text-primary"
        >
          {recipeEmoji ? `${recipeEmoji} ` : ""}
          {recipeTitle}
        </Link>
        <div className="text-xs text-text-muted">
          {authorUsername ? (
            <Link
              href={`/profil/${authorUsername}`}
              className="hover:text-primary"
            >
              @{authorUsername}
            </Link>
          ) : (
            <span>{authorLabel}</span>
          )}
          <span className="mx-1.5">·</span>
          <time dateTime={createdAt}>
            {new Date(createdAt).toLocaleDateString("tr-TR")}
          </time>
        </div>
        {caption && (
          <p className="line-clamp-2 text-xs text-text-muted">{caption}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {isHidden ? t("actionShow") : t("actionHide")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md border border-error/30 px-2.5 py-1 text-xs text-error transition-colors hover:bg-error hover:text-white disabled:opacity-60"
          >
            {t("actionDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}
