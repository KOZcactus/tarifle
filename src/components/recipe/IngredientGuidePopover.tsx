"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { IngredientGuide } from "@/lib/recipe/ingredient-guide";

interface IngredientGuidePopoverProps {
  guide: IngredientGuide;
}

/**
 * Tarif sayfasinda ingredient adinin yaninda bilgi (i) butonu. Tikla/
 * hover ile popover acilir, "neden bu malzeme + yerine ne kullanilabilir"
 * gosterir. Mod H Batch 1+2 (top 100 ingredient) backend ile dolduruldu.
 *
 * Davranis:
 *   - Mobile-first: click ile toggle (hover mobile'da yok)
 *   - Desktop: focus + hover acar
 *   - Outside click ile kapanir
 *   - Escape ile kapanir
 *   - ARIA aria-expanded + role=dialog
 */
export function IngredientGuidePopover({ guide }: IngredientGuidePopoverProps) {
  const t = useTranslations("recipe.ingredientGuide");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex print:hidden">
      <button
        type="button"
        aria-label={t("toggleAria", { name: guide.name })}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-text-muted/40 text-[10px] font-semibold text-text-muted transition-colors hover:border-accent-blue hover:bg-accent-blue/10 hover:text-accent-blue"
      >
        i
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("dialogAria", { name: guide.name })}
          className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-border bg-bg-card p-3 text-xs shadow-lg sm:w-80"
        >
          <p className="mb-1.5 font-semibold text-text">{guide.name}</p>
          <p className="mb-2 leading-relaxed text-text-muted">
            {guide.whyUsed}
          </p>

          {guide.substitutes.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 font-semibold text-text">
                {t("substitutesLabel")}
              </p>
              <ul className="flex flex-wrap gap-1">
                {guide.substitutes.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-[11px] text-accent-blue"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {guide.notes && (
            <p className="rounded-md border-l-2 border-secondary/40 bg-secondary/5 px-2 py-1.5 leading-relaxed text-text-muted">
              <span className="font-semibold text-secondary">
                {t("noteLabel")}
              </span>{" "}
              {guide.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
