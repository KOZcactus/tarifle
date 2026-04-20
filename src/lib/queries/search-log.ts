import { prisma } from "@/lib/prisma";

/**
 * Search log, `/tarifler?q=...` SSR akışında fire-and-forget kullanılır.
 * Her query bir satır açar; aggregate pipe'ı top-N ve trend için
 * `normalizedQuery` bucket'ı üzerinden gruplar.
 *
 * Prune: yok. Ölçek büyürse 90+ gün prune cron iş eklenir.
 *
 * Not: log insert'i request'i bloklamasın; caller `.catch(() => {})`
 * ile drop eder.
 */

const MAX_QUERY_LEN = 200;

/**
 * TR-aware normalize, "Köfte", "KÖFTE", "köfte " hepsi aynı bucket.
 * asciifold lowercase + outer trim + boş normalize'ı kabul etme
 * (çağıran tarafta guard ediyoruz ama defansif).
 */
export function normalizeSearchQuery(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_QUERY_LEN)
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u")
    .replace(/\s+/g, " ");
}

/**
 * Fire-and-forget. Caller:
 *   `logSearchQuery(q, resultCount, userId).catch(() => {})`
 *
 * Boş query veya 1 karakterden kısa normalize → no-op. Bu tek-harf
 * "a", "ı" gibi gürültüyü analytics'ten uzak tutar.
 */
export async function logSearchQuery(
  rawQuery: string,
  resultCount: number,
  userId: string | null = null,
): Promise<void> {
  const trimmed = rawQuery.trim().slice(0, MAX_QUERY_LEN);
  if (trimmed.length < 2) return;
  const normalized = normalizeSearchQuery(trimmed);
  if (normalized.length < 2) return;

  await prisma.searchQuery.create({
    data: {
      query: trimmed,
      normalizedQuery: normalized,
      resultCount,
      userId,
    },
  });
}

export interface SearchFrequencyEntry {
  query: string;
  count: number;
  avgResultCount: number;
}

/**
 * Top N en çok aranan term, normalizedQuery bucket'ı üzerinden
 * groupBy. `display` için ilk görülen orijinal query'yi alıyoruz
 * (admin dashboard için: kullanıcı "Köfte" yazdıysa "köfte" yerine
 * kapital olanı göstermek daha okunur).
 */
export async function getTopSearchQueries(
  days = 7,
  limit = 10,
): Promise<SearchFrequencyEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const grouped = await prisma.searchQuery.groupBy({
    by: ["normalizedQuery"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _avg: { resultCount: true },
    orderBy: { _count: { normalizedQuery: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  // Display label için her bucket'a 1 örnek raw query çek.
  const samples = await prisma.searchQuery.findMany({
    where: {
      normalizedQuery: { in: grouped.map((g) => g.normalizedQuery) },
      createdAt: { gte: since },
    },
    select: { normalizedQuery: true, query: true },
    distinct: ["normalizedQuery"],
  });
  const sampleByKey = new Map(samples.map((s) => [s.normalizedQuery, s.query]));

  return grouped.map((g) => ({
    query: sampleByKey.get(g.normalizedQuery) ?? g.normalizedQuery,
    count: g._count._all,
    avgResultCount: Math.round(g._avg.resultCount ?? 0),
  }));
}
