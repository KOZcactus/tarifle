import type { Allergen } from "@prisma/client";
import { ALLERGEN_EMOJI, ALLERGEN_LABEL } from "@/lib/allergens";

interface AllergenBadgesProps {
  allergens: readonly Allergen[];
  /**
   * "warning" — amber surface, used on recipe detail where we want the info
   * to stand out for allergy-concerned readers.
   * "subtle" — muted chip style for card grids where real estate is tight.
   */
  tone?: "warning" | "subtle";
}

/**
 * Renders a row of allergen chips. Renders nothing when the array is empty
 * so callers can drop this in without guarding. Accessibility: a single
 * list group with a descriptive `aria-label` reads as "İçindekiler:
 * Gluten, Süt, Yumurta" in screen readers.
 */
export function AllergenBadges({ allergens, tone = "warning" }: AllergenBadgesProps) {
  if (allergens.length === 0) return null;

  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium";
  const toneClasses =
    tone === "warning"
      ? "border border-secondary/40 bg-secondary/10 text-secondary"
      : "border border-border bg-bg-elevated text-text-muted";

  return (
    <ul
      className="flex flex-wrap items-center gap-2"
      aria-label={`Alerjen içerikleri: ${allergens
        .map((a) => ALLERGEN_LABEL[a])
        .join(", ")}`}
    >
      {allergens.map((a) => (
        <li key={a} className={`${base} ${toneClasses}`}>
          <span aria-hidden="true">{ALLERGEN_EMOJI[a]}</span>
          <span>{ALLERGEN_LABEL[a]}</span>
        </li>
      ))}
    </ul>
  );
}
