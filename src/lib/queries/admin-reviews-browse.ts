import { prisma } from "@/lib/prisma";

/**
 * Admin "Yorumlar" browse sayfası — moderation queue DEĞİL. Tüm review'ları
 * tarihe göre listelemek için kullanılır. `getPendingReviews` (moderation)
 * yanında ayrı bir helper — iki sayfa farklı mindset'lerde çalışır.
 *
 * Varsayılan default: son 7 gün (kullanıcı yük bindirmeyi istemiyor).
 * `from` / `to` explicit verilirse custom range uygulanır. `null` olursa
 * "tümü" (risk: büyük liste — çağrıştıran sayfa uyarı göstermeli).
 */

export const REVIEW_BROWSE_PAGE_SIZE = 20;

export type ReviewBrowseRange =
  | { kind: "last7" }
  | { kind: "last30" }
  | { kind: "thisMonth" }
  | { kind: "custom"; from: Date; to: Date }
  | { kind: "all" };

/**
 * URL search params'tan güvenli bir range objesi türet. URL'de geçersiz
 * veya eksik tarih varsa default "last7" dön. String → Date parse hatası
 * sessizce default'a düşer (mistyped URL 500 vermesin).
 */
export function resolveRange(input: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}): ReviewBrowseRange {
  const { preset, from, to } = input;

  if (preset === "all") return { kind: "all" };
  if (preset === "last30") return { kind: "last30" };
  if (preset === "thisMonth") return { kind: "thisMonth" };
  if (preset === "custom" && from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (
      !Number.isNaN(fromDate.getTime()) &&
      !Number.isNaN(toDate.getTime()) &&
      fromDate <= toDate
    ) {
      // Custom range inclusive — toDate'i günün sonuna çek ki aynı gün
      // başlangıç+bitiş seçilirse o gün tamamen dahil olsun.
      const toEnd = new Date(toDate);
      toEnd.setHours(23, 59, 59, 999);
      return { kind: "custom", from: fromDate, to: toEnd };
    }
  }
  return { kind: "last7" };
}

/** Verilen range'i `gte`/`lte` where clause'una çevir. "all" → clause yok. */
export function rangeToWhere(
  range: ReviewBrowseRange,
): { createdAt?: { gte?: Date; lte?: Date } } {
  const now = new Date();
  if (range.kind === "all") return {};
  if (range.kind === "last7") {
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { createdAt: { gte: since } };
  }
  if (range.kind === "last30") {
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { createdAt: { gte: since } };
  }
  if (range.kind === "thisMonth") {
    const since = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { createdAt: { gte: since } };
  }
  // custom
  return { createdAt: { gte: range.from, lte: range.to } };
}

/**
 * Paginated review browse query. Newest-first, eager user + recipe.
 */
export async function getReviewsForBrowse(params: {
  range: ReviewBrowseRange;
  page: number;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? REVIEW_BROWSE_PAGE_SIZE;
  const where = rangeToWhere(params.range);
  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, username: true, name: true } },
        recipe: { select: { slug: true, title: true, emoji: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);
  return { rows, total };
}
