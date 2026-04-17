import Link from "next/link";

interface SortableHeaderProps<TKey extends string> {
  label: string;
  sortKey: TKey;
  currentSort: TKey;
  currentOrder: "asc" | "desc";
  /** Base path for href, existing search params preserved by caller. */
  buildHref: (nextSort: TKey, nextOrder: "asc" | "desc") => string;
  align?: "left" | "right";
}

/**
 * Admin table header cell that toggles sort order on click via URL params.
 * Renders ▲/▼ arrow for the active column, nothing for others. No JS
 * required — pure RSC Link works with page searchParams.
 *
 * Click behavior:
 *   - If already sorted by this key: flip asc ↔ desc
 *   - If sorted by another key: switch to this key with default desc
 */
export function SortableHeader<TKey extends string>({
  label,
  sortKey,
  currentSort,
  currentOrder,
  buildHref,
  align = "left",
}: SortableHeaderProps<TKey>) {
  const isActive = currentSort === sortKey;
  const nextOrder: "asc" | "desc" = isActive
    ? currentOrder === "desc"
      ? "asc"
      : "desc"
    : "desc";

  const arrow = isActive ? (currentOrder === "desc" ? "▼" : "▲") : "";

  return (
    <th
      className={`pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-text-muted ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <Link
        href={buildHref(sortKey, nextOrder)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-text ${
          isActive ? "text-text" : ""
        }`}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="min-w-[8px]">
          {arrow}
        </span>
      </Link>
    </th>
  );
}
