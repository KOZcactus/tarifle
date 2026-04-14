"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toggleBookmarkAction } from "@/lib/actions/bookmark";
import {
  createCollectionAction,
  toggleRecipeInCollectionAction,
} from "@/lib/actions/collection";
import { addRecipeIngredientsAction } from "@/lib/actions/shopping-list";
import { useDismiss } from "@/hooks/useDismiss";

interface CollectionSummary {
  id: string;
  name: string;
  emoji: string | null;
  count: number;
  hasRecipe: boolean;
}

interface SaveMenuProps {
  recipeId: string;
  initialBookmarked: boolean;
  initialCollections: CollectionSummary[];
  ingredientCount: number;
}

type Toast = { kind: "success" | "error"; message: string } | null;

export function SaveMenu({
  recipeId,
  initialBookmarked,
  initialCollections,
  ingredientCount,
}: SaveMenuProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [collections, setCollections] = useState<CollectionSummary[]>(initialCollections);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const [isPending, startTransition] = useTransition();

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setIsCreating(false);
  }, []);
  const menuRef = useDismiss<HTMLDivElement>({
    isOpen,
    onClose: closeMenu,
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const requireAuth = () => {
    if (!session?.user) {
      router.push("/giris");
      return false;
    }
    return true;
  };

  function handleToggleBookmark() {
    if (!requireAuth()) return;
    const prev = bookmarked;
    setBookmarked(!prev);

    startTransition(async () => {
      const result = await toggleBookmarkAction(recipeId);
      if (!result.success) {
        setBookmarked(prev);
        setToast({ kind: "error", message: result.error ?? "Kaydedilemedi." });
      } else {
        setToast({
          kind: "success",
          message: result.bookmarked ? "Tarif kaydedildi." : "Kayıtlardan çıkarıldı.",
        });
      }
    });
  }

  function handleAddToShoppingList() {
    if (!requireAuth()) return;
    startTransition(async () => {
      const result = await addRecipeIngredientsAction(recipeId);
      if (!result.success) {
        setToast({ kind: "error", message: result.error ?? "Eklenemedi." });
        return;
      }
      const { added, merged } = result.data!;
      if (added === 0) {
        setToast({
          kind: "success",
          message: "Tüm malzemeler zaten listede.",
        });
      } else {
        const mergedLabel = merged > 0 ? ` (${merged} zaten vardı)` : "";
        setToast({
          kind: "success",
          message: `${added} malzeme alışveriş listene eklendi${mergedLabel}.`,
        });
      }
    });
  }

  function handleToggleCollection(collectionId: string, hasRecipe: boolean) {
    if (!requireAuth()) return;
    const shouldAdd = !hasRecipe;

    // Optimistic update
    setCollections((cs) =>
      cs.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              hasRecipe: shouldAdd,
              count: shouldAdd ? c.count + 1 : Math.max(0, c.count - 1),
            }
          : c,
      ),
    );

    startTransition(async () => {
      const result = await toggleRecipeInCollectionAction(
        collectionId,
        recipeId,
        shouldAdd,
      );
      if (!result.success) {
        // Roll back
        setCollections((cs) =>
          cs.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  hasRecipe: hasRecipe,
                  count: hasRecipe ? c.count + 1 : Math.max(0, c.count - 1),
                }
              : c,
          ),
        );
        setToast({ kind: "error", message: result.error ?? "Güncellenemedi." });
      }
    });
  }

  function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth()) return;
    const name = newCollectionName.trim();
    if (name.length < 2) {
      setToast({ kind: "error", message: "Ad en az 2 karakter olmalıdır." });
      return;
    }

    startTransition(async () => {
      const createResult = await createCollectionAction({ name });
      if (!createResult.success || !createResult.data) {
        setToast({
          kind: "error",
          message: createResult.error ?? "Koleksiyon oluşturulamadı.",
        });
        return;
      }

      const newId = createResult.data.id;
      const addResult = await toggleRecipeInCollectionAction(newId, recipeId, true);
      if (!addResult.success) {
        setToast({ kind: "error", message: addResult.error ?? "Tarif eklenemedi." });
        return;
      }

      setCollections((cs) => [
        {
          id: newId,
          name,
          emoji: null,
          count: 1,
          hasRecipe: true,
        },
        ...cs,
      ]);
      setNewCollectionName("");
      setIsCreating(false);
      setToast({ kind: "success", message: `"${name}" koleksiyonuna eklendi.` });
    });
  }

  return (
    <div className="relative flex flex-wrap gap-2" ref={menuRef}>
      {/* Kaydet */}
      <button
        onClick={handleToggleBookmark}
        disabled={isPending}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
          bookmarked
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-text-muted hover:border-primary hover:text-primary"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={bookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
        {bookmarked ? "Kaydedildi" : "Kaydet"}
      </button>

      {/* Alışveriş listesine ekle */}
      <button
        onClick={handleAddToShoppingList}
        disabled={isPending || ingredientCount === 0}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-accent-green hover:text-accent-green disabled:opacity-50"
        title={`${ingredientCount} malzeme alışveriş listene eklenir`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        Listeye ekle
      </button>

      {/* Koleksiyon menüsü */}
      <button
        onClick={() => {
          if (!requireAuth()) return;
          setIsOpen((v) => !v);
        }}
        disabled={isPending}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-accent-blue hover:text-accent-blue"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M9 6h6" />
        </svg>
        Koleksiyon
        {collections.some((c) => c.hasRecipe) && (
          <span className="rounded-full bg-accent-blue/20 px-1.5 text-xs text-accent-blue">
            {collections.filter((c) => c.hasRecipe).length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 w-72 origin-top-left rounded-xl border border-border bg-bg-card p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
            Koleksiyonlarım
          </p>

          <div className="max-h-64 overflow-y-auto">
            {collections.length === 0 ? (
              <p className="px-2 py-3 text-sm text-text-muted">
                Henüz bir koleksiyonun yok.
              </p>
            ) : (
              collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleToggleCollection(c.id, c.hasRecipe)}
                  disabled={isPending}
                  role="menuitemcheckbox"
                  aria-checked={c.hasRecipe}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-bg-elevated"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        c.hasRecipe
                          ? "border-primary bg-primary text-white"
                          : "border-border"
                      }`}
                    >
                      {c.hasRecipe && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate text-text">
                      {c.emoji && <span className="mr-1">{c.emoji}</span>}
                      {c.name}
                    </span>
                  </span>
                  <span className="text-xs text-text-muted">{c.count}</span>
                </button>
              ))
            )}
          </div>

          <div className="mt-2 border-t border-border pt-2">
            {isCreating ? (
              <form onSubmit={handleCreateCollection} className="flex gap-2 px-2">
                <input
                  autoFocus
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Koleksiyon adı"
                  maxLength={100}
                  className="flex-1 rounded-md border border-border bg-bg-elevated px-2 py-1 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover"
                >
                  Ekle
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-primary transition-colors hover:bg-primary/10"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Yeni koleksiyon oluştur
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
            toast.kind === "success" ? "bg-accent-green" : "bg-error"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
