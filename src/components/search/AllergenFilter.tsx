"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Allergen } from "@prisma/client";
import {
  ALLERGEN_EMOJI,
  ALLERGEN_LABEL,
  ALLERGEN_ORDER,
} from "@/lib/allergens";

interface AllergenFilterProps {
  /** The allergens currently being excluded (from URL). */
  selected: readonly Allergen[];
}

/**
 * "İçermesin" allergen filter row. Toggle chips that add/remove
 * `?alerjen=<ENUM>` from the URL. Multiple allergens can be active; the
 * backend uses `hasSome` under a NOT to hide any recipe touching the list.
 *
 * Style: quieter than the top-level filters — this is a secondary tool,
 * not the primary browse experience. Collapsed-by-default would be
 * friendlier still, but the chip row is compact enough inline.
 */
export function AllergenFilter({ selected }: AllergenFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations("filters");

  function toggle(allergen: Allergen) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("alerjen");
    const isActive = current.includes(allergen);
    params.delete("alerjen");
    const next = isActive
      ? current.filter((a) => a !== allergen)
      : [...current, allergen];
    next.forEach((a) => params.append("alerjen", a));
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("alerjen");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-lg border border-border bg-bg-card p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("allergen.header")}
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-medium text-primary hover:text-primary-hover"
          >
            {t("clearCount", { count: selected.length })}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALLERGEN_ORDER.map((a) => {
          const isActive = selected.includes(a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-error/40 bg-error/15 text-error"
                  : "border-border bg-bg text-text-muted hover:border-primary/40 hover:text-text"
              }`}
              title={
                isActive
                  ? t("allergen.titleShow", { label: ALLERGEN_LABEL[a] })
                  : t("allergen.titleHide", { label: ALLERGEN_LABEL[a] })
              }
            >
              <span aria-hidden="true">{ALLERGEN_EMOJI[a]}</span>
              <span>{ALLERGEN_LABEL[a]}</span>
              {isActive && <span aria-hidden="true">×</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
