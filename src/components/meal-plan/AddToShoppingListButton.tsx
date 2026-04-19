"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { addMealPlanToShoppingListAction } from "@/lib/actions/meal-plan";

interface AddToShoppingListButtonProps {
  slotCount: number;
}

/**
 * Plan dolu slot'larındaki tarif ingredient'lerini mevcut alışveriş
 * listesine toplu ekler. Boş plan durumunda buton disabled + tooltip
 * "önce tarif seç". Başarılı submit'te inline toast: kaç tarif + kaç
 * item eklendi, listeye link.
 */
export function AddToShoppingListButton({
  slotCount,
}: AddToShoppingListButtonProps) {
  const t = useTranslations("mealPlanner.shoppingList");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const disabled = slotCount === 0 || pending;

  function handleClick() {
    startTransition(async () => {
      const res = await addMealPlanToShoppingListAction();
      if (res.success && res.data) {
        setResult({
          ok: true,
          text: t("successAdded", {
            recipeCount: res.data.recipeCount,
            addedCount: res.data.totalAdded,
            mergedCount: res.data.totalMerged,
          }),
        });
      } else {
        setResult({ ok: false, text: res.error ?? t("error") });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-text-muted/30"
      >
        <span aria-hidden="true">🛒</span>
        {pending ? t("adding") : t("addButton")}
      </button>
      {result && (
        <div
          className={`flex flex-wrap items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
            result.ok
              ? "bg-accent-green/10 text-accent-green"
              : "bg-error/10 text-error"
          }`}
        >
          <span>{result.text}</span>
          {result.ok && (
            <Link
              href="/alisveris-listesi"
              className="font-medium underline-offset-2 hover:underline"
            >
              {t("openList")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
