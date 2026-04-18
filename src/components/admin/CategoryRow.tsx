"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/admin-taxonomy";

interface CategoryRowProps {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  sortOrder: number;
  recipeCount: number;
  childrenCount: number;
}

type EditField = "name" | "emoji" | "sortOrder" | null;

export function CategoryRow({
  id,
  name,
  slug,
  emoji,
  sortOrder,
  recipeCount,
  childrenCount,
}: CategoryRowProps) {
  const t = useTranslations("admin.categories");
  const tActions = useTranslations("admin.actions");
  const router = useRouter();
  const [editing, setEditing] = useState<EditField>(null);
  const [draftName, setDraftName] = useState(name);
  const [draftEmoji, setDraftEmoji] = useState(emoji ?? "");
  const [draftSort, setDraftSort] = useState(String(sortOrder));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(field: EditField, value: string | number | null) {
    if (field === null) return;
    startTransition(async () => {
      const res = await updateCategoryAction({
        categoryId: id,
        patch: { [field]: value },
      });
      if (res.success) {
        setEditing(null);
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? t("rowSaveFailed"));
      }
    });
  }

  function cancel() {
    setEditing(null);
    setDraftName(name);
    setDraftEmoji(emoji ?? "");
    setDraftSort(String(sortOrder));
    setError(null);
  }

  function del() {
    if (recipeCount > 0 || childrenCount > 0) return;
    if (!confirm(t("rowDeleteConfirm", { name }))) return;
    startTransition(async () => {
      const res = await deleteCategoryAction({ categoryId: id });
      if (res.success) router.refresh();
      else setError(res.error ?? t("rowDeleteFailed"));
    });
  }

  return (
    <li className="grid grid-cols-[60px_1fr_90px_90px_60px] items-center gap-3 px-4 py-2.5 text-sm">
      {/* Emoji */}
      <div>
        {editing === "emoji" ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={draftEmoji}
              onChange={(e) => setDraftEmoji(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
                if (e.key === "Enter")
                  submit("emoji", draftEmoji.trim() || null);
              }}
              maxLength={10}
              autoFocus
              aria-label={t("rowEmojiTitle")}
              className="w-12 rounded border border-border bg-bg-card px-1 py-0.5 text-lg focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => submit("emoji", draftEmoji.trim() || null)}
              disabled={pending}
              className="rounded bg-primary px-1.5 py-0.5 text-xs text-white"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing("emoji")}
            className="inline-flex h-7 w-10 items-center justify-center rounded border border-transparent text-lg hover:border-border hover:bg-bg-elevated"
            aria-label={t("rowEmojiTitle")}
          >
            {emoji ?? "—"}
          </button>
        )}
      </div>

      {/* Name + slug */}
      <div>
        {editing === "name" ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
                if (e.key === "Enter") submit("name", draftName.trim());
              }}
              maxLength={100}
              autoFocus
              aria-label={t("rowNameTitle")}
              className="rounded border border-border bg-bg-card px-2 py-0.5 focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => submit("name", draftName.trim())}
              disabled={pending || draftName.trim().length < 2}
              className="rounded bg-primary px-2 py-0.5 text-xs text-white disabled:opacity-50"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded border border-border px-2 py-0.5 text-xs text-text-muted"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing("name")}
            className="group inline-flex items-center gap-1.5 text-left font-medium text-text hover:text-primary"
          >
            <span>{name}</span>
            <span
              aria-hidden="true"
              className="text-xs text-text-muted opacity-0 group-hover:opacity-100"
            >
              ✎
            </span>
          </button>
        )}
        <p className="font-mono text-xs text-text-muted">{slug}</p>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>

      {/* Sort order */}
      <div>
        {editing === "sortOrder" ? (
          <input
            type="number"
            value={draftSort}
            onChange={(e) => setDraftSort(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") {
                const n = parseInt(draftSort, 10);
                if (!isNaN(n) && n >= 0 && n <= 999) submit("sortOrder", n);
              }
            }}
            onBlur={() => {
              const n = parseInt(draftSort, 10);
              if (!isNaN(n) && n !== sortOrder && n >= 0 && n <= 999) {
                submit("sortOrder", n);
              } else {
                cancel();
              }
            }}
            min={0}
            max={999}
            autoFocus
            aria-label={t("rowOrderTitle")}
            className="w-16 rounded border border-border bg-bg-card px-1 py-0.5 text-right text-xs tabular-nums focus:border-primary focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing("sortOrder")}
            className="inline-flex h-6 w-16 items-center justify-end rounded border border-transparent pr-2 text-xs tabular-nums text-text-muted hover:border-border hover:bg-bg-elevated"
            aria-label={t("rowOrderTitle")}
          >
            {sortOrder}
          </button>
        )}
      </div>

      {/* Usage count */}
      <div className="text-right text-xs text-text-muted tabular-nums">
        {t("rowRecipeSuffix", { count: recipeCount })}
        {childrenCount > 0 && (
          <span className="ml-1 text-[10px]">
            {t("rowChildrenSuffix", { count: childrenCount })}
          </span>
        )}
      </div>

      {/* Delete */}
      <div className="text-right">
        <button
          type="button"
          onClick={del}
          disabled={pending || recipeCount > 0 || childrenCount > 0}
          title={recipeCount > 0 || childrenCount > 0 ? t("rowDeleteDisabled") : tActions("delete")}
          className="rounded border border-border px-2 py-0.5 text-xs text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {tActions("delete")}
        </button>
      </div>
    </li>
  );
}
