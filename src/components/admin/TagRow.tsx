"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  renameTagAction,
  deleteTagAction,
} from "@/lib/actions/admin-taxonomy";

interface TagRowProps {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

/**
 * Tag tablosunda bir satır — inline rename + delete. Silme yalnızca
 * usage 0 ise (backend guard'ı da var).
 */
export function TagRow({ id, name, slug, usageCount }: TagRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function commit() {
    if (draft.trim() === name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await renameTagAction({ tagId: id, name: draft.trim() });
      if (res.success) {
        setEditing(false);
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? "Güncellenemedi.");
      }
    });
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
    setError(null);
  }

  function del() {
    if (usageCount > 0) return; // guard
    if (
      !confirm(`"${name}" etiketini silmek istediğine emin misin?`)
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteTagAction({ tagId: id });
      if (res.success) router.refresh();
      else setError(res.error ?? "Silinemedi.");
    });
  }

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
                if (e.key === "Enter") commit();
              }}
              maxLength={50}
              autoFocus
              aria-label="Etiket adı"
              className="rounded border border-border bg-bg-card px-2 py-0.5 focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={commit}
              disabled={pending || draft.trim().length < 2}
              className="rounded bg-primary px-2 py-0.5 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded border border-border px-2 py-0.5 text-xs text-text-muted hover:bg-bg-elevated"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group inline-flex items-center gap-1.5 text-left font-medium text-text hover:text-primary"
            aria-label={`${name} düzenle`}
          >
            <span>{name}</span>
            <span
              aria-hidden="true"
              className="text-xs text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
            >
              ✎
            </span>
          </button>
        )}
        <p className="mt-0.5 font-mono text-xs text-text-muted">{slug}</p>
        {error && <p className="mt-0.5 text-xs text-error">{error}</p>}
      </div>
      <span
        className="shrink-0 rounded-full bg-bg-elevated px-2 py-0.5 text-xs tabular-nums text-text-muted"
        title="Kullanım sayısı"
      >
        {usageCount} tarif
      </span>
      <button
        type="button"
        onClick={del}
        disabled={pending || usageCount > 0}
        title={
          usageCount > 0
            ? `${usageCount} tarif kullanıyor — önce tariflerden kaldır`
            : "Etiketi sil"
        }
        className="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Sil
      </button>
    </li>
  );
}
