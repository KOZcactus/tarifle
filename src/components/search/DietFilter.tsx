"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface DietFilterProps {
  /** Tag slugs currently active from the URL — typically ["vegan"], ["vejetaryen"], or both. */
  activeTagSlugs: readonly string[];
}

const DIET_OPTIONS = [
  { slug: "vejetaryen", label: "Vejetaryen", emoji: "🌿" },
  { slug: "vegan", label: "Vegan", emoji: "🌱" },
] as const;

/**
 * Dedicated diet filter row. The underlying plumbing is the same `?etiket=`
 * query param used by the generic tag filter, but surfacing a dedicated
 * row makes these two options discoverable — a visitor shouldn't have to
 * scroll through 15 hashtag chips to find "vejetaryen".
 *
 * Toggle semantics match AllergenFilter for consistency (aria-pressed,
 * × on active). Filter-by-tag is inclusive (AND with other filters) —
 * if both vegetarian + vegan are active, recipes must have BOTH tags
 * (which is fine: vegan ⊂ vegetarian, so selecting vegan alone already
 * implies vegetarian).
 */
export function DietFilter({ activeTagSlugs }: DietFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggle(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("etiket");
    const isActive = current.includes(slug);
    params.delete("etiket");
    const next = isActive
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    next.forEach((s) => params.append("etiket", s));
    params.delete("page");
    router.push(`/tarifler?${params.toString()}`);
  }

  return (
    <div className="rounded-lg border border-border bg-bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Diyet
      </p>
      <div className="flex flex-wrap gap-1.5">
        {DIET_OPTIONS.map(({ slug, label, emoji }) => {
          const isActive = activeTagSlugs.includes(slug);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-accent-green/50 bg-accent-green/15 text-accent-green"
                  : "border-border bg-bg text-text-muted hover:border-primary/40 hover:text-text"
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
              {isActive && <span aria-hidden="true">×</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
