/**
 * Tarif zaman cizelgesi (RecipeTimeline) hesaplama yardimcilari.
 *
 * Schema'da prepMinutes + cookMinutes + totalMinutes var. Marine/dinlenme
 * ayri alan degil; totalMinutes - (prep + cook) > 0 ise bu fark
 * "bekleme/marine/dinlenme" segmenti olarak gosterilir. Boylece
 * Sauerbraten gibi 2-3 gun marine'li tariflerde kullanici gorsel olarak
 * "buna 3 gun lazim" anliyor.
 */

export type TimelineSegmentKind = "prep" | "wait" | "cook";

export interface TimelineSegment {
  kind: TimelineSegmentKind;
  label: string;
  minutes: number;
  /** Bar uzerindeki yuzde (0-100). */
  widthPercent: number;
}

export interface TimelineData {
  totalMinutes: number;
  segments: TimelineSegment[];
}

const LABELS: Record<TimelineSegmentKind, string> = {
  prep: "Hazırlık",
  wait: "Bekleme/Marine",
  cook: "Pişirme",
};

export function computeTimeline(input: {
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
}): TimelineData {
  const prep = Math.max(0, input.prepMinutes ?? 0);
  const cook = Math.max(0, input.cookMinutes ?? 0);
  const total = Math.max(0, input.totalMinutes ?? 0);
  const wait = Math.max(0, total - prep - cook);
  const totalForBar = prep + wait + cook;

  if (totalForBar === 0) {
    return { totalMinutes: 0, segments: [] };
  }

  const all: { kind: TimelineSegmentKind; minutes: number }[] = [
    { kind: "prep" as const, minutes: prep },
    { kind: "wait" as const, minutes: wait },
    { kind: "cook" as const, minutes: cook },
  ];
  const raw = all.filter((s) => s.minutes > 0);

  // Yuzde hesabi: cok kucuk segmentleri (örn. 1dk vs 2 gun marine) bar'da
  // gorulebilir tutmak icin minimum %3 garantisi. Toplam %100'e
  // normalize edilir.
  const MIN_PCT = 3;
  const exactPercents = raw.map((s) => (s.minutes / totalForBar) * 100);
  const adjusted = exactPercents.map((p) => Math.max(p, MIN_PCT));
  const adjustedSum = adjusted.reduce((s, x) => s + x, 0);
  const normalized = adjusted.map((p) => (p / adjustedSum) * 100);

  const segments: TimelineSegment[] = raw.map((s, i) => ({
    kind: s.kind,
    label: LABELS[s.kind],
    minutes: s.minutes,
    widthPercent: normalized[i] ?? 0,
  }));

  return {
    totalMinutes: totalForBar,
    segments,
  };
}

/**
 * Dakikayi insan okuyucu formata cevir.
 *   30 -> "30 dk"
 *   90 -> "1 sa 30 dk"
 *   120 -> "2 sa"
 *   1500 -> "1 gün 1 sa"
 *   2880 -> "2 gün"
 *   4320 -> "3 gün"
 */
export function formatTimelineMinutes(min: number): string {
  if (min <= 0) return "0 dk";
  if (min < 60) return `${min} dk`;
  if (min < 24 * 60) {
    const hours = Math.floor(min / 60);
    const remaining = min % 60;
    if (remaining === 0) return `${hours} sa`;
    return `${hours} sa ${remaining} dk`;
  }
  const days = Math.floor(min / (24 * 60));
  const remainingHours = Math.floor((min % (24 * 60)) / 60);
  if (remainingHours === 0) return `${days} gün`;
  return `${days} gün ${remainingHours} sa`;
}
