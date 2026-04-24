"use client";

import { useState, useTransition } from "react";
import { consumeRecipeFromPantryAction } from "@/lib/actions/pantry";

interface CookedButtonProps {
  recipeId: string;
  defaultServings: number;
}

/**
 * "Pişirdim" butonu: recipe sayfasındaki pantry rozeti altında render olur.
 * Kullanıcı pişirdiği porsiyon sayısını (default recipe.servingCount) girer,
 * confirm eder, server action pantry'den düşer.
 *
 * Döner: decision listesi (hangi malzeme ne kadar düşürüldü) + not found + skip.
 */
export function CookedButton({ recipeId, defaultServings }: CookedButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [servings, setServings] = useState(defaultServings);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);

  function handleCook() {
    setFeedback(null);
    startTransition(async () => {
      const res = await consumeRecipeFromPantryAction({
        recipeId,
        servingsCooked: servings,
      });
      if (!res.success || !res.data) {
        setFeedback({
          tone: "error",
          message: res.error ?? "Tüketme başarısız.",
        });
        return;
      }
      const { decisions, notFoundRecipeIngredients, skippedUnknownQuantity, skippedIncompatibleUnit } =
        res.data;
      if (decisions.length === 0) {
        // Düşülecek decision yok ama skip edilen var (null quantity veya
        // unit uyumsuz) → kullanıcıya net anlat. Yoksa "bulunamadı" fallback.
        const skipParts: string[] = [];
        if (skippedUnknownQuantity.length > 0) {
          skipParts.push(
            `${skippedUnknownQuantity.length} malzeme dolabında var ama miktarsız, atlandı`,
          );
        }
        if (skippedIncompatibleUnit.length > 0) {
          skipParts.push(
            `${skippedIncompatibleUnit.length} malzeme birim uyumsuz, atlandı`,
          );
        }
        if (notFoundRecipeIngredients.length > 0) {
          skipParts.push(
            `${notFoundRecipeIngredients.length} malzeme dolabında yok`,
          );
        }
        const base =
          skippedUnknownQuantity.length > 0 || skippedIncompatibleUnit.length > 0
            ? "Bu tarifte dolaptan düşülecek sayısal malzeme yok."
            : "Dolabında eşleşen malzeme bulunamadı, bir şey düşülmedi.";
        setFeedback({
          tone: "info",
          message: `${base}${skipParts.length > 0 ? " " + skipParts.join(", ") + "." : ""}`,
        });
        return;
      }
      const summary = decisions
        .slice(0, 3)
        .map((d) => {
          const amt = d.amountUsed;
          const val = Number.isInteger(amt) ? String(amt) : amt.toFixed(1).replace(/\.0$/, "");
          const unitSuffix = d.unit ? " " + d.unit : "";
          return `${d.ingredientName}: -${val}${unitSuffix}`;
        })
        .join(", ");
      const more = decisions.length > 3 ? ` +${decisions.length - 3} daha` : "";
      const skipInfo =
        skippedUnknownQuantity.length > 0
          ? ` (${skippedUnknownQuantity.length} malzeme miktarsız, atlandı)`
          : "";
      setFeedback({
        tone: "success",
        message: `Dolaptan düşüldü: ${summary}${more}.${skipInfo}`,
      });
      setExpanded(false);
    });
  }

  return (
    <div className="mt-3">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-900 transition-colors hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:border-emerald-500"
        >
          <span aria-hidden>🍳</span>
          Pişirdim, dolabımdan düş
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-300/60 bg-emerald-50 p-3 text-sm dark:border-emerald-700/60 dark:bg-emerald-950/40">
          <label className="flex items-center gap-2">
            <span className="font-medium">Pişirdiğin porsiyon:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={servings}
              onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-sm focus:border-primary focus:outline-none"
              disabled={isPending}
            />
          </label>
          <button
            type="button"
            onClick={handleCook}
            disabled={isPending}
            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {isPending ? "Düşülüyor..." : "Onayla"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            disabled={isPending}
            className="text-xs text-text-muted underline underline-offset-2 hover:text-text"
          >
            İptal
          </button>
        </div>
      )}
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-2 text-xs ${
            feedback.tone === "success"
              ? "text-emerald-700 dark:text-emerald-300"
              : feedback.tone === "error"
                ? "text-error"
                : "text-text-muted"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
