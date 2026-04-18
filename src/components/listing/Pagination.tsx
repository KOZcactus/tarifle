import Link from "next/link";

/** Shared listing pagination — used by `/tarifler` (full search) and
 *  `/tarifler/[kategori]` (category landing). Builds page URLs by cloning
 *  the current `searchParams`, stripping `page`, and appending `?page=N`
 *  to `basePath`. The visible window caps at 5 numbered pages with
 *  leading/trailing "…" ellipses that link to the first/last page.
 */

type PaginationTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface PaginationProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
  t: PaginationTranslator;
}

export function Pagination({
  basePath,
  currentPage,
  totalPages,
  searchParams,
  t,
}: PaginationProps) {
  function buildPageUrl(page: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (!value || key === "page") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.set(key, value);
      }
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  // Visible window: up to 5 numbered pages around the current one.
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
      aria-label={t("pagination.aria")}
    >
      {currentPage > 1 && (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
          rel="prev"
        >
          {t("pagination.previous")}
        </Link>
      )}

      {start > 1 && (
        <>
          <Link
            href={buildPageUrl(1)}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-text-muted">…</span>}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildPageUrl(page)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            page === currentPage
              ? "border-primary bg-primary text-white"
              : "border-border hover:bg-bg-card"
          }`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-text-muted">…</span>}
          <Link
            href={buildPageUrl(totalPages)}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-bg-card"
          rel="next"
        >
          {t("pagination.next")}
        </Link>
      )}
    </nav>
  );
}
