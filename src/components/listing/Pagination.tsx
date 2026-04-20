import Link from "next/link";

/** Shared listing pagination, used by `/tarifler` (full search) and
 *  `/tarifler/[kategori]` (category landing). Builds page URLs by cloning
 *  the current `searchParams`, stripping `page`, and appending `?page=N`
 *  to `basePath`.
 *
 *  Visible window:
 *   - totalPages ≤ FULL_WINDOW_THRESHOLD → render every page number
 *     (kullanıcı "başta kaç sayfa varsa o kadar" dedi, az sayfa için
 *     ellipsis işine yaramaz)
 *   - Aksi halde current ± 3 window + leading/trailing "…" + first/last
 *     anchor pages (klasik Google-style pagination)
 *
 *  Visual treatment:
 *   - Aktif sayfa: ince siyah border + bold (kare kutu referansı —
 *     kullanıcı gönderdiği sample image'da bu aşamayı istedi)
 *   - Inactive sayfalar: border yok, hover'da soft bg, muted digit rengi
 *   - Prev / Next: her zaman render edilir; ilk/son sayfada span olarak
 *     disabled render (layout shift olmasın + klavye navigasyonu net)
 *
 *  Optional `totalItems` + `pageSize` props render a "Gösteriliyor X–Y ·
 *  toplam N tarif" counter above the nav.
 */

/** Sayfa sayısı bu eşikten az/eşit ise ellipsis uygulanmaz, tüm sayfa
 *  numaraları yan yana gösterilir. 9 seçildi çünkü mobilde çok küçük
 *  ekranda 9 hane + Prev/Next taşmadan sığar (tabular-nums ile). */
const FULL_WINDOW_THRESHOLD = 9;

/** Current page etrafında gösterilecek komşu sayfa sayısı (tek tarafta).
 *  current ± NEIGHBOR_RADIUS + current = (NEIGHBOR_RADIUS*2 + 1) rakam. */
const NEIGHBOR_RADIUS = 2;

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
  /** Total matching recipes (unpaginated). When provided with `pageSize`
   *  enables the "showing X–Y of Z" counter above the nav. */
  totalItems?: number;
  /** Items per page, must match the `limit` passed to getRecipes(). */
  pageSize?: number;
}

/** Build the list of pagination items to render. Numbers are page indices,
 *  "…" strings are ellipsis separators. Exported for unit testing, the
 *  windowing math is easy to break when refactoring, so we lock the output
 *  shape with tests. */
export function buildPageItems(
  currentPage: number,
  totalPages: number,
): (number | "…")[] {
  if (totalPages <= FULL_WINDOW_THRESHOLD) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | "…")[] = [];
  const windowStart = Math.max(2, currentPage - NEIGHBOR_RADIUS);
  const windowEnd = Math.min(totalPages - 1, currentPage + NEIGHBOR_RADIUS);

  items.push(1);
  if (windowStart > 2) items.push("…");
  for (let p = windowStart; p <= windowEnd; p++) items.push(p);
  if (windowEnd < totalPages - 1) items.push("…");
  items.push(totalPages);

  return items;
}

export function Pagination({
  basePath,
  currentPage,
  totalPages,
  searchParams,
  t,
  totalItems,
  pageSize,
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

  const items = buildPageItems(currentPage, totalPages);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  // Counter, only shown when caller supplies totalItems + pageSize.
  // Kompakt tek satır: "13–24/1401 gösteriliyor" (TR) / "Showing 13–24/1401"
  // (EN). Önceki iki-parçalı layout (X–Y gösteriliyor · toplam N tarif) user
  // geri bildirimiyle sadeleştirildi, slash ile range+total birleşti, tek
  // cümle daha az gürültülü.
  let rangeCounter: string | null = null;
  if (typeof totalItems === "number" && typeof pageSize === "number" && totalItems > 0) {
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalItems);
    rangeCounter = t("pagination.rangeCounter", { from, to, total: totalItems });
  }

  // Shared base classes for every clickable nav element. Concrete button
  // look is added per-variant so the active page, inactive numbers, and
  // prev/next labels can diverge without duplicating padding rules.
  const baseCell =
    "inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-3 py-2 text-sm tabular-nums transition-colors";

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      {rangeCounter && (
        <p className="text-sm tabular-nums text-text-muted">{rangeCounter}</p>
      )}
      <nav
        className="flex flex-wrap items-center justify-center gap-1"
        aria-label={t("pagination.aria")}
      >
        {isFirstPage ? (
          <span
            className={`${baseCell} cursor-not-allowed text-text-muted/50`}
            aria-disabled="true"
          >
            {t("pagination.previous")}
          </span>
        ) : (
          <Link
            href={buildPageUrl(currentPage - 1)}
            className={`${baseCell} text-text hover:bg-bg-card`}
            rel="prev"
          >
            {t("pagination.previous")}
          </Link>
        )}

        {items.map((item, idx) =>
          item === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className={`${baseCell} cursor-default text-text-muted`}
              aria-hidden="true"
            >
              …
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              className={`${baseCell} border border-text font-semibold text-text`}
              aria-current="page"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={buildPageUrl(item)}
              className={`${baseCell} text-text-muted hover:bg-bg-card hover:text-text`}
            >
              {item}
            </Link>
          ),
        )}

        {isLastPage ? (
          <span
            className={`${baseCell} cursor-not-allowed text-text-muted/50`}
            aria-disabled="true"
          >
            {t("pagination.next")}
          </span>
        ) : (
          <Link
            href={buildPageUrl(currentPage + 1)}
            className={`${baseCell} text-text hover:bg-bg-card`}
            rel="next"
          >
            {t("pagination.next")}
          </Link>
        )}
      </nav>
    </div>
  );
}
