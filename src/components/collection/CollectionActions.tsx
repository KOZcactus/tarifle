"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCollectionAction,
  updateCollectionAction,
} from "@/lib/actions/collection";

interface CollectionActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    emoji: string | null;
    isPublic: boolean;
  };
  username: string;
}

export function CollectionActions({ collection, username }: CollectionActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [emoji, setEmoji] = useState(collection.emoji ?? "");
  const [isPublic, setIsPublic] = useState(collection.isPublic);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEditing(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isEditing]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateCollectionAction(collection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        emoji: emoji.trim() || undefined,
        isPublic,
      });
      if (!result.success) {
        setError(result.error ?? "Güncellenemedi.");
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `"${collection.name}" koleksiyonu silinsin mi? İçindeki tarifler silinmez.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCollectionAction(collection.id);
      if (!result.success) {
        setError(result.error ?? "Silinemedi.");
        return;
      }
      router.push(`/profil/${username}`);
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => setIsEditing(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
      >
        Düzenle
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:border-error hover:text-error"
      >
        Sil
      </button>

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsEditing(false)}
        >
          <div
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-xl"
          >
            <h2 className="mb-4 font-heading text-lg font-bold text-text">
              Koleksiyonu düzenle
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Ad
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    maxLength={10}
                    placeholder="🍝"
                    className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-center text-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">
                    Görünürlük
                  </label>
                  <select
                    value={isPublic ? "public" : "private"}
                    onChange={(e) => setIsPublic(e.target.value === "public")}
                    className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="private">Gizli</option>
                    <option value="public">Herkese açık</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Örn. Hafta sonları için denemek istediklerim"
                  className="w-full resize-none rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
