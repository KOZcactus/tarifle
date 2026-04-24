/**
 * Recipe sayfasında kullanıcı pantry ile tarif ingredient karşılaştırmasını
 * göstermek için rozet + detay popover. Server component (sync render),
 * match summary prop olarak gelir.
 *
 * Renk skalası:
 *   - Tam uyuyor (missing=0, partial=0): emerald
 *   - Kısmi var (partial>0 veya missing<=2): amber
 *   - Çok eksik (missing>2): gray
 */
import Link from "next/link";
import type { PantryMatchSummary } from "@/lib/pantry/match";

interface PantryMatchBadgeProps {
  summary: PantryMatchSummary;
}

export function PantryMatchBadge({ summary }: PantryMatchBadgeProps) {
  if (summary.total === 0) return null;

  const { missing, partial, covered, presentUnknown, total, shortages } = summary;
  const haveCount = covered + presentUnknown + partial;

  let tone: "emerald" | "amber" | "gray";
  let headline: string;

  if (missing === 0 && partial === 0) {
    tone = "emerald";
    headline = "Dolabına tam uyuyor";
  } else if (missing <= 2 || partial > 0) {
    tone = "amber";
    headline =
      missing === 0
        ? `${total}/${total} var, ${partial} tanesi miktar kısmi`
        : `${haveCount}/${total} dolabında`;
  } else {
    tone = "gray";
    headline = `${haveCount}/${total} dolabında, ${missing} eksik`;
  }

  const toneStyles: Record<typeof tone, string> = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
    amber:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
    gray:
      "border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-100",
  };
  const iconByTone: Record<typeof tone, string> = {
    emerald: "🎒",
    amber: "🛒",
    gray: "🛒",
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm ${toneStyles[tone]}`}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 font-semibold">
        <span aria-hidden>{iconByTone[tone]}</span>
        <span>{headline}</span>
      </div>

      {(missing > 0 || partial > 0) && (
        <ul className="flex flex-wrap gap-1.5 text-xs">
          {shortages.slice(0, 4).map((s) => (
            <li
              key={s.name}
              className="rounded-full border border-amber-300/60 bg-white/60 px-2 py-0.5 font-medium dark:bg-amber-950/60"
            >
              {s.name}: {formatShortage(s)}
            </li>
          ))}
          {summary.details
            .filter((d) => d.status === "missing")
            .slice(0, 4)
            .map((d) => (
              <li
                key={d.recipeIngredient}
                className="rounded-full border border-gray-300/60 bg-white/60 px-2 py-0.5 font-medium dark:bg-gray-900/60"
              >
                {d.recipeIngredient} yok
              </li>
            ))}
          {missing + partial > 8 && (
            <li className="rounded-full px-2 py-0.5 italic">+{missing + partial - 8} daha</li>
          )}
        </ul>
      )}

      <Link
        href="/dolap"
        className="self-start text-xs font-medium underline-offset-4 hover:underline"
      >
        Dolabımı düzenle →
      </Link>
    </div>
  );
}

function formatShortage(s: {
  required: number;
  available: number;
  shortage: number;
  unit: string;
}): string {
  const unitSuffix = s.unit ? ` ${s.unit}` : "";
  const req = formatNumber(s.required);
  const avail = formatNumber(s.available);
  return `${avail}${unitSuffix} var, ${req}${unitSuffix} gerek`;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}
