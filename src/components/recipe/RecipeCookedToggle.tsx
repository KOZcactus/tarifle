"use client";

import { useState, useTransition } from "react";
import { toggleRecipeCookedAction } from "@/lib/actions/recipe-cooked";

interface RecipeCookedToggleProps {
  recipeId: string;
  slug: string;
  initialCount: number;
  initialIsCooked: boolean;
  isLoggedIn: boolean;
}

/**
 * "Pişirdim ✓" toggle butonu + sosyal kanıt count "X kişi pişirdi".
 * Bookmark pattern'iyle paralel: tek tıkla on/off, optimistic update,
 * server action revalidate eder. Pantry CookedButton'dan ayrı: bu
 * sadece sosyal işaret + count, dolap düşürme yapmaz.
 *
 * Anonymous kullanıcı butona tıklayınca login redirect (server tarafı
 * "Giriş yapmalısınız" döner; UI inline mesaj + giriş linki).
 */
export function RecipeCookedToggle({
  recipeId,
  slug,
  initialCount,
  initialIsCooked,
  isLoggedIn,
}: RecipeCookedToggleProps) {
  const [count, setCount] = useState(initialCount);
  const [isCooked, setIsCooked] = useState(initialIsCooked);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    if (!isLoggedIn) {
      setError("Pişirdim işareti için önce giriş yap.");
      return;
    }
    // Optimistic
    const prevIsCooked = isCooked;
    const prevCount = count;
    const optimisticIsCooked = !prevIsCooked;
    setIsCooked(optimisticIsCooked);
    setCount(prevCount + (optimisticIsCooked ? 1 : -1));
    startTransition(async () => {
      const res = await toggleRecipeCookedAction({ recipeId, slug });
      if (!res.success) {
        // Rollback
        setIsCooked(prevIsCooked);
        setCount(prevCount);
        setError(res.error);
        return;
      }
      // Sync to server truth
      setIsCooked(res.isCooked);
      setCount(res.count);
    });
  }

  const label = isCooked ? "Pişirdim ✓" : "Pişirdim";

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          aria-pressed={isCooked}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
            isCooked
              ? "border border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
              : "border border-border bg-bg-card text-text hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          }`}
        >
          <span aria-hidden>👨‍🍳</span>
          {label}
        </button>
        {count > 0 && (
          <span className="text-xs text-text-muted">
            {count === 1
              ? "1 kişi pişirdi"
              : `${count.toLocaleString("tr-TR")} kişi pişirdi`}
          </span>
        )}
      </div>
      {error && (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-xs text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
