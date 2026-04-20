"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { MealType } from "@prisma/client";
import { RecipePickerDialog } from "./RecipePickerDialog";
import { clearMealPlanSlotAction } from "@/lib/actions/meal-plan";

interface SlotRecipe {
  id: string;
  title: string;
  slug: string;
  emoji: string | null;
  totalMinutes: number;
}

interface MealSlotProps {
  dayOfWeek: number;
  mealType: MealType;
  recipe: SlotRecipe | null;
  slotLabel: string;
}

/**
 * 7×3 grid'deki tek hücre. İki durum:
 *   - Boş: "+ Tarif ekle" buton → RecipePickerDialog açar
 *   - Dolu: tarif emoji + title + "değiştir" + "kaldır" butonları
 *
 * Optimistic UI yok, server action sonrası revalidatePath tetikler,
 * Next fresh render'ı yollar. Transition feedback için `pending`
 * durumu opacity düşürür.
 */
export function MealSlot({
  dayOfWeek,
  mealType,
  recipe,
  slotLabel,
}: MealSlotProps) {
  const t = useTranslations("mealPlanner.slot");
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      await clearMealPlanSlotAction({ dayOfWeek, mealType });
    });
  }

  return (
    <>
      <div
        className={`relative flex min-h-[5.5rem] rounded-lg border border-border p-2 transition-opacity ${
          pending ? "opacity-50" : ""
        } ${recipe ? "bg-bg-card" : "bg-bg-elevated/50 border-dashed"}`}
      >
        {recipe ? (
          <div className="flex w-full flex-col gap-1">
            <Link
              href={`/tarif/${recipe.slug}`}
              className="flex items-start gap-2 hover:text-primary"
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {recipe.emoji ?? "🍽️"}
              </span>
              <span className="line-clamp-2 text-xs font-medium text-text">
                {recipe.title}
              </span>
            </Link>
            <p className="text-[10px] tabular-nums text-text-muted">
              {recipe.totalMinutes} dk
            </p>
            <div className="mt-auto flex gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={pending}
                className="rounded px-1.5 py-0.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-primary disabled:opacity-50"
              >
                {t("change")}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={pending}
                className="rounded px-1.5 py-0.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
              >
                {t("remove")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-full w-full flex-col items-center justify-center rounded-md text-xs text-text-muted transition-colors hover:bg-bg-card hover:text-primary"
          >
            <span aria-hidden="true" className="text-lg">
              +
            </span>
            <span>{t("addRecipe")}</span>
          </button>
        )}
      </div>

      <RecipePickerDialog
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        dayOfWeek={dayOfWeek}
        mealType={mealType}
        slotLabel={slotLabel}
      />
    </>
  );
}
