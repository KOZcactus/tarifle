import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  buildHref: (page: number) => string;
}

/**
 * Compact admin pagination: "Önceki / 1 2 … 5 / Sonraki" style bar.
 * Always shows first, last, current ± 1, and ellipsis gaps.
 * No JS, pure Link with URL param update.
 */
export async function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  buildHref,
}: PaginationBarProps) {
  const t = await getTranslations("admin.common");
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) {
    return (
      <p className="mt-3 text-xs text-text-muted">
        {t("paginationSingle", { count: totalItems })}
      </p>
    );
  }

  // Window around current: always show 1, last, cur-1, cur, cur+1
  const nums = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const pages = Array.from(nums)
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  // Insert "..." markers for gaps
  const withGaps: (number | "...")[] = [];
  let prev = 0;
  for (const n of pages) {
    if (n - prev > 1) withGaps.push("...");
    withGaps.push(n);
    prev = n;
  }

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav
      aria-label={t("paginationAria")}
      className="mt-4 flex items-center justify-between gap-3 text-sm"
    >
      <p className="text-xs text-text-muted tabular-nums">
        {t("paginationRange", {
          from: (currentPage - 1) * pageSize + 1,
          to: Math.min(currentPage * pageSize, totalItems),
          total: totalItems,
        })}
      </p>
      <div className="flex items-center gap-1">
        {currentPage > 1 ? (
          <Link
            href={buildHref(prevPage)}
            className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-bg-elevated"
          >
            {t("paginationPrev")}
          </Link>
        ) : (
          <span className="rounded-md border border-border px-2.5 py-1 text-xs text-text-muted opacity-40">
            {t("paginationPrev")}
          </span>
        )}
        {withGaps.map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} className="px-1 text-text-muted">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`min-w-[32px] rounded-md border px-2.5 py-1 text-center text-xs tabular-nums ${
                p === currentPage
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border hover:bg-bg-elevated"
              }`}
            >
              {p}
            </Link>
          ),
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(nextPage)}
            className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-bg-elevated"
          >
            {t("paginationNext")}
          </Link>
        ) : (
          <span className="rounded-md border border-border px-2.5 py-1 text-xs text-text-muted opacity-40">
            {t("paginationNext")}
          </span>
        )}
      </div>
    </nav>
  );
}
