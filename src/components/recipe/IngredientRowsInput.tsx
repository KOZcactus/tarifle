"use client";

import { useState } from "react";
import { INGREDIENT_UNITS, type Ingredient } from "@/lib/ingredients";

interface IngredientRowsInputProps {
  /** Hidden field name used when the enclosing form serialises, we put a
   * JSON-encoded `Ingredient[]` into this FormData key. */
  name: string;
  /** Initial rows; defaults to one empty row so the user sees the shape. */
  initial?: Ingredient[];
  /** Caller-controlled upper bound. Matches validator's 40. */
  maxRows?: number;
}

/**
 * Dynamic amount + unit + name rows for variation ingredients. Replaces the
 * old freeform textarea so data lands in the DB as structured
 * `{ amount, unit, name }` objects rather than "2 yağ" strings that can't
 * be aggregated later.
 *
 * Serialises on submit via a hidden input that holds `JSON.stringify(rows)`.
 * The server action reads that key and validates via `variationSchema`. Empty
 * rows (no name) are stripped before serialisation so the user doesn't have
 * to delete a trailing blank manually.
 */
export function IngredientRowsInput({
  name,
  initial,
  maxRows = 40,
}: IngredientRowsInputProps) {
  const [rows, setRows] = useState<Ingredient[]>(
    initial && initial.length > 0
      ? initial
      : [{ amount: "", unit: "", name: "" }],
  );

  const update = (index: number, patch: Partial<Ingredient>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, { amount: "", unit: "", name: "" }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => {
      if (prev.length === 1) {
        // Never fully empty, reset instead of removing the last row.
        return [{ amount: "", unit: "", name: "" }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Serialisation: strip rows with blank name (user was mid-typing and
  // changed their mind). At least one valid row is enforced by the validator
  // so we surface that error server-side, not here.
  const payload = JSON.stringify(
    rows
      .map((r) => ({ ...r, name: r.name.trim() }))
      .filter((r) => r.name.length > 0),
  );

  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        return (
          <div key={index} className="flex items-start gap-2">
            <label className="sr-only" htmlFor={`ing-amount-${index}`}>
              Miktar
            </label>
            <input
              id={`ing-amount-${index}`}
              type="text"
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => update(index, { amount: e.target.value })}
              maxLength={50}
              placeholder="2"
              className="w-16 rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Malzeme ${index + 1} miktarı`}
            />

            <label className="sr-only" htmlFor={`ing-unit-${index}`}>
              Birim
            </label>
            <select
              id={`ing-unit-${index}`}
              value={row.unit}
              onChange={(e) => update(index, { unit: e.target.value })}
              className="w-36 rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Malzeme ${index + 1} birimi`}
            >
              {INGREDIENT_UNITS.map((u) => (
                <option key={u || "(boş)"} value={u}>
                  {u === "" ? ", birim," : u}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor={`ing-name-${index}`}>
              Ad
            </label>
            <input
              id={`ing-name-${index}`}
              type="text"
              value={row.name}
              onChange={(e) => update(index, { name: e.target.value })}
              maxLength={200}
              placeholder="domates"
              className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Malzeme ${index + 1} adı`}
            />

            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1 && !row.name && !row.amount}
              className="rounded-lg border border-border px-2 py-2 text-sm text-text-muted transition-colors hover:border-error hover:text-error disabled:opacity-40"
              aria-label={`Malzeme ${index + 1}'i sil`}
              title="Satırı sil"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {/* No tabindex leak, focus moves linearly through amount → unit →
                name → remove → next row. */}
            {isLast && (
              <span aria-hidden="true" className="sr-only">
                Son malzeme satırı
              </span>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        disabled={rows.length >= maxRows}
        className="mt-1 inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        + Malzeme ekle
      </button>

      <input type="hidden" name={name} value={payload} />
    </div>
  );
}
