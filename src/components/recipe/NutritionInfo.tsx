"use client";

import { useTranslations } from "next-intl";

interface NutritionInfoProps {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export function NutritionInfo({ calories, protein, carbs, fat }: NutritionInfoProps) {
  const t = useTranslations("recipe.nutrition");
  if (!calories && !protein && !carbs && !fat) return null;

  const items = [
    {
      key: "calories" as const,
      value: calories,
      unitKey: "calorieUnit",
      prefix: "~",
      color: "text-primary",
    },
    {
      key: "protein" as const,
      value: protein,
      unitKey: "proteinUnit",
      prefix: "",
      color: "text-accent-green",
    },
    {
      key: "carbs" as const,
      value: carbs,
      unitKey: "carbsUnit",
      prefix: "",
      color: "text-secondary",
    },
    {
      key: "fat" as const,
      value: fat,
      unitKey: "fatUnit",
      prefix: "",
      color: "text-accent-blue",
    },
  ].filter((item) => item.value != null);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-muted">{t("title")}</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className="text-center">
            <p className={`text-xl font-bold ${item.color}`}>
              {item.prefix}
              {item.value}
            </p>
            <p className="text-xs text-text-muted">{t(item.unitKey)}</p>
          </div>
        ))}
      </div>
      {/* Trust + legal disclaimer. Values are derived from ingredient
          amounts using public nutrition tables (USDA / TÜBİTAK), so they
          sit in a "reasonable estimate" band — not a lab assay. The
          recipe detail calorie+macros also show as "~" for the same
          reason; this footnote just makes the contract explicit. */}
      <p className="mt-3 border-t border-border pt-3 text-xs text-text-muted">
        {t("approximateNote")}
      </p>
    </div>
  );
}
