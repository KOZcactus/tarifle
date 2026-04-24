"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { getUserPantryAction } from "@/lib/actions/pantry";

interface LoadPantryButtonProps {
  /** Ingredient list'ine ekleme callback'i (unique TR normalize set). */
  onLoad: (ingredients: string[]) => void;
  /** Kullanıcı authenticated değilse component hiç render edilmez. */
  isAuthenticated: boolean;
}

/**
 * AI Asistan v3 + v4'e "🎒 Dolabımı getir" tek tık butonu.
 * Server action pantry'yi çeker, yaklaşan son kullanma tarihli
 * olanlar listenin başında (getUserPantryAction zaten expiry asc
 * sort döner). İngredient isimlerini callback ile form'a geçirir.
 */
export function LoadPantryButton({ onLoad, isAuthenticated }: LoadPantryButtonProps) {
  const t = useTranslations("ai.loadPantry");
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <p className="text-xs text-text-muted">
        <span aria-hidden className="mr-1">🎒</span>
        {t("loginHint")}
      </p>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await getUserPantryAction();
      if (!res.success || !res.data) {
        setError(res.error ?? t("fetchError"));
        return;
      }
      if (res.data.length === 0) {
        setError(t("emptyPantry"));
        return;
      }
      // Son kullanma yakın (<=3 gün) ve düzgün kullanım için
      // displayName değil ingredientName (normalize) kullan.
      // Amaç: aynı ingredient pantry history'e ve matcher'a doğru girer.
      onLoad(res.data.map((i) => i.displayName));
      setCount(res.data.length);
      setTimeout(() => setCount(null), 3000);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden>🎒</span>
        {isPending ? t("loading") : t("button")}
      </button>
      {count !== null && (
        <span className="text-emerald-600 dark:text-emerald-400">
          ✓ {t("loadedCount", { count })}
        </span>
      )}
      {error && (
        <span className="text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
