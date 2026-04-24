"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  clearPantryHistory,
  readPantryHistory,
} from "@/lib/ai/pantry-history";

interface Props {
  /** Fires with the chosen ingredient so the parent can splice it into
   *  its textarea state. Parent decides where to append. */
  onAdd: (ingredient: string) => void;
  /** Re-read trigger: bump this when history may have changed (e.g.
   *  after a successful plan generation that pushed new entries). */
  refreshKey?: number;
  className?: string;
}

/**
 * Shows "📌 Son kullandığın malzemeler: [chip][chip]..." under the
 * pantry input on AI modals. Pure client, localStorage-backed, zero
 * network cost. Hidden when history is empty so new users don't see
 * an empty band.
 */
export function PantryHistoryChips({ onAdd, refreshKey = 0, className = "" }: Props) {
  const t = useTranslations("pantryHistory");
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    // Hydration-safe read: localStorage SSR'da yok, useEffect ile
    // client-only okumayi geciktirir. refreshKey artarsa yeniden okur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readPantryHistory());
  }, [refreshKey]);

  if (items.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-xs ${className}`}
      role="group"
      aria-label={t("label")}
    >
      <span className="text-text-muted">{t("label")}</span>
      {items.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onAdd(name)}
          className="rounded-full border border-surface-muted bg-surface px-2 py-0.5 text-text-muted transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={t("addAria", { name })}
        >
          {name}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          clearPantryHistory();
          setItems([]);
        }}
        className="ml-1 text-text-muted underline underline-offset-2 hover:text-text"
      >
        {t("clear")}
      </button>
    </div>
  );
}

/** Helper to append an ingredient to a CSV/newline textarea value. */
export function appendIngredient(text: string, name: string): string {
  const trimmed = text.trim();
  if (!trimmed) return `${name}, `;
  // If the text already ends in a separator, append cleanly
  if (/[,\n]\s*$/.test(text)) return `${text}${name}, `;
  return `${text}, ${name}, `;
}
