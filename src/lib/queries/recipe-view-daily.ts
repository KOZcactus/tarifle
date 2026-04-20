import { prisma } from "@/lib/prisma";

/**
 * Günlük görüntülenme sayacı, `/tarif/[slug]` SSR akışında
 * fire-and-forget upsert. Recipe.viewCount toplam (all-time) kalırken
 * bu tablo gün-gün dağılımı tutar: admin analytics view trend grafiği
 * + ileride "bu hafta en çok okunan" listesi buradan beslenir.
 *
 * Zaman dilimi: UTC gün. TR lokal günü kullanmak trend sinyalini
 * bozmaz ve DST karmaşasına girmiyoruz.
 */

/** UTC günü normalize et, saat/dakika bilgisini at. */
export function toUtcDateBucket(instant: Date = new Date()): Date {
  return new Date(
    Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()),
  );
}

/**
 * Fire-and-forget. Caller:
 *   `logDailyView(recipeId).catch(() => {});`
 */
export async function logDailyView(recipeId: string): Promise<void> {
  const date = toUtcDateBucket();
  await prisma.recipeViewDaily.upsert({
    where: { recipeId_date: { recipeId, date } },
    update: { count: { increment: 1 } },
    create: { recipeId, date, count: 1 },
  });
}

export interface DailyViewBucket {
  /** ISO YYYY-MM-DD (UTC), grafik ekseninde label olarak kullanılır. */
  date: string;
  /** O gün tüm tariflerde toplam görüntülenme. */
  views: number;
}

/**
 * Son N günün trend serisi. Boş günler 0 ile doldurulur, grafikte
 * sürekli çizgi için.
 *
 * @param days Dahil edilen pencere uzunluğu (default 30). Bugün dahil.
 */
export async function getDailyViewTrend(
  days = 30,
): Promise<DailyViewBucket[]> {
  if (days < 1) return [];
  const today = toUtcDateBucket();
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const grouped = await prisma.recipeViewDaily.groupBy({
    by: ["date"],
    where: { date: { gte: since } },
    _sum: { count: true },
  });

  const byDate = new Map<string, number>();
  for (const g of grouped) {
    byDate.set(toIsoDate(g.date), g._sum.count ?? 0);
  }

  const result: DailyViewBucket[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < days; i++) {
    const iso = toIsoDate(cursor);
    result.push({ date: iso, views: byDate.get(iso) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

/**
 * Tek tarif için son N gündeki toplam görüntülenme.
 * Chip ("Bu hafta X kez") için hızlı aggregate.
 */
export async function getRecipeViewsLastDays(
  recipeId: string,
  days = 7,
): Promise<number> {
  if (days < 1) return 0;
  const today = toUtcDateBucket();
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const agg = await prisma.recipeViewDaily.aggregate({
    where: { recipeId, date: { gte: since } },
    _sum: { count: true },
  });
  return agg._sum.count ?? 0;
}

function toIsoDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
