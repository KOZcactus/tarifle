"use client";

import { useTranslations } from "next-intl";

interface NutritionInfoProps {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  /** Faz 2 enrichment alanlari (oturum 20). RecipeNutrition'dan gelir,
   *  null ise NutritionData esleseme yetersiz, gizlenir. */
  sugar?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  satFat?: number | null;
  /** Eslesme orani 0-1, %50 alti yaklasik flag UI'da gosterir. */
  matchedRatio?: number | null;
}

export function NutritionInfo({
  calories,
  protein,
  carbs,
  fat,
  sugar,
  fiber,
  sodium,
  satFat,
  matchedRatio,
}: NutritionInfoProps) {
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

  // Faz 2 enrichment ek satir: sugar / fiber / sodium / satFat. Sadece
  // RecipeNutrition tablosunda eslesme bulunan tariflerde gosterilir,
  // eslesme yetersiz tariflerde gizlenir (Faz 2 USDA seed kapsami %86).
  const extras = [
    {
      key: "sugar" as const,
      value: sugar,
      label: "Şeker",
      unit: "g",
      icon: "🍬",
    },
    {
      key: "fiber" as const,
      value: fiber,
      label: "Lif",
      unit: "g",
      icon: "🌾",
    },
    {
      key: "sodium" as const,
      value: sodium,
      label: "Sodyum",
      unit: "mg",
      icon: "🧂",
    },
    {
      key: "satFat" as const,
      value: satFat,
      label: "Doymuş yağ",
      unit: "g",
      icon: "🧈",
    },
  ].filter((item) => item.value != null);

  const isApproximate =
    typeof matchedRatio === "number" && matchedRatio < 0.5;

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

      {/* Faz 2 ek besin verisi (oturum 20). USDA bazli, porsiyon basi
          sugar/fiber/sodium/satFat. Eslesmesi olmayan tariflerde gizlenir.
          UI: kucuk grid, ana macro grid'inin altinda border-top ile ayri. */}
      {extras.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {extras.map((item) => (
              <div key={item.key} className="text-center">
                <p className="text-base font-semibold text-text">
                  <span aria-hidden="true" className="mr-1 text-sm">
                    {item.icon}
                  </span>
                  {item.value}
                  {item.unit}
                </p>
                <p className="text-[10px] text-text-muted">{item.label}</p>
              </div>
            ))}
          </div>
          {isApproximate && (
            <p className="mt-2 text-[10px] italic text-text-muted">
              ⚠️ Bu tarif için besin verisi eşleşmesi sınırlı (%
              {Math.round((matchedRatio ?? 0) * 100)}), değerler tahminidir.
            </p>
          )}
        </div>
      )}

      {/* Trust + legal disclaimer. Values are derived from ingredient
          amounts using public nutrition tables (USDA / TÜBİTAK), so they
          sit in a "reasonable estimate" band, not a lab assay. The
          recipe detail calorie+macros also show as "~" for the same
          reason; this footnote just makes the contract explicit. */}
      <p className="mt-3 border-t border-border pt-3 text-xs text-text-muted">
        {t("approximateNote")}
      </p>
    </div>
  );
}
