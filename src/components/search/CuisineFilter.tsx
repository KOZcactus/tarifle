"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CUISINE_CODES, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";

interface CuisineFilterProps {
  /** The cuisine codes currently selected (from URL). */
  selected: readonly string[];
}

/**
 * Cuisine inclusion filter row. Toggle chips that add/remove
 * `?mutfak=<code>` from the URL. Multiple cuisines can be active;
 * the backend uses `WHERE cuisine IN (...)` to show matching recipes.
 *
 * Accent colour: accent-blue to differentiate from allergen filter
 * (which uses error/red for exclusion semantics).
 */
export function CuisineFilter({ selected }: CuisineFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations("filters");
  const tCuisine = useTranslations("cuisines");

  function toggle(code: CuisineCode) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("mutfak");
    const isActive = current.includes(code);
    params.delete("mutfak");
    const next = isActive
      ? current.filter((c) => c !== code)
      : [...current, code];
    next.forEach((c) => params.append("mutfak", c));
    params.delete("page"); // reset to first page after filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mutfak");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-lg border border-border bg-bg-card p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("cuisine.header")}
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-medium text-accent-blue hover:text-accent-blue/80"
          >
            {t("clearCount", { count: selected.length })}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CUISINE_CODES.map((code) => {
          const isActive = selected.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-accent-blue/40 bg-accent-blue/15 text-accent-blue"
                  : "border-border bg-bg text-text-muted hover:border-accent-blue/40 hover:text-text"
              }`}
              title={
                isActive
                  ? t("cuisine.titleRemove", { label: tCuisine(code) })
                  : t("cuisine.titleAdd", { label: tCuisine(code) })
              }
            >
              <span aria-hidden="true">{CUISINE_FLAG[code]}</span>
              <span>{tCuisine(code)}</span>
              {isActive && <span aria-hidden="true">×</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
