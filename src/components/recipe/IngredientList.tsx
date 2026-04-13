"use client";

import { useState } from "react";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string | null;
  isOptional: boolean;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServingCount: number;
}

export function IngredientList({ ingredients, baseServingCount }: IngredientListProps) {
  const [servingCount, setServingCount] = useState(baseServingCount);
  const multiplier = servingCount / baseServingCount;

  function scaleAmount(amount: string): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    const scaled = num * multiplier;
    if (scaled === Math.floor(scaled)) return String(scaled);
    return scaled.toFixed(1);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Malzemeler</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setServingCount(Math.max(1, servingCount - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm transition-colors hover:bg-bg-elevated"
            aria-label="Porsiyon azalt"
          >
            −
          </button>
          <span className="min-w-[3rem] text-center text-sm font-medium">
            {servingCount} kişi
          </span>
          <button
            onClick={() => setServingCount(servingCount + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm transition-colors hover:bg-bg-elevated"
            aria-label="Porsiyon artır"
          >
            +
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {ingredients.map((ing) => (
          <li
            key={ing.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-bg-elevated"
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm">
              <span className="font-medium">
                {scaleAmount(ing.amount)} {ing.unit}
              </span>{" "}
              {ing.name}
              {ing.isOptional && (
                <span className="ml-1 text-xs text-text-muted">(isteğe bağlı)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
