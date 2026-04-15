"use client";

import { useMemo, useState } from "react";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string | null;
  isOptional: boolean;
  /**
   * Optional section label ("Hamur için", "Şerbet için", …). Multi-component
   * recipes group their ingredients under headings so the cook can scan the
   * structure at a glance. NULL = ungrouped, renders as a flat list.
   */
  group?: string | null;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServingCount: number;
}

/** Stable bucket order helper — groups preserve first-appearance order so
 * the author's intent survives ("Hamur için" comes before "Şerbet için"
 * when that's how they listed it). Ungrouped items bucket under `null`
 * which we render last without a heading.
 */
function bucketByGroup(
  items: readonly Ingredient[],
): { heading: string | null; items: Ingredient[] }[] {
  const order: (string | null)[] = [];
  const buckets = new Map<string | null, Ingredient[]>();

  for (const ing of items) {
    const key = ing.group && ing.group.trim() ? ing.group.trim() : null;
    if (!buckets.has(key)) {
      order.push(key);
      buckets.set(key, []);
    }
    buckets.get(key)!.push(ing);
  }

  // Keep ungrouped items at the bottom so author-labeled sections read as
  // the primary structure. If the only bucket IS the null one, this is
  // a no-op and the list renders flat.
  const sortedOrder = [...order].sort((a, b) => {
    if (a === b) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return 0;
  });

  return sortedOrder.map((heading) => ({
    heading,
    items: buckets.get(heading) ?? [],
  }));
}

export function IngredientList({ ingredients, baseServingCount }: IngredientListProps) {
  const [servingCount, setServingCount] = useState(baseServingCount);
  const multiplier = servingCount / baseServingCount;

  const buckets = useMemo(() => bucketByGroup(ingredients), [ingredients]);
  const hasSections = buckets.some((b) => b.heading !== null);

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

      {buckets.map((bucket) => (
        <section
          key={bucket.heading ?? "__ungrouped__"}
          className={bucket.heading ? "mb-4 last:mb-0" : ""}
        >
          {bucket.heading && (
            <h3 className="mb-1.5 mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {bucket.heading}
            </h3>
          )}
          <ul className="space-y-1.5">
            {bucket.items.map((ing) => (
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
                    <span className="ml-1 text-xs text-text-muted">
                      (isteğe bağlı)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {/* When sections are present, add a subtle separator between
              them so the visual hierarchy is unmistakable. */}
          {hasSections && bucket.heading && (
            <div className="mt-3 h-px bg-border/60" aria-hidden="true" />
          )}
        </section>
      ))}
    </div>
  );
}
