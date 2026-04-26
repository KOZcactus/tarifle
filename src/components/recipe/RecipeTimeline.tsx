import {
  computeTimeline,
  formatTimelineMinutes,
  type TimelineSegmentKind,
} from "@/lib/recipe/timeline";

interface RecipeTimelineProps {
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
}

const SEGMENT_STYLE: Record<TimelineSegmentKind, string> = {
  prep: "bg-sky-400 dark:bg-sky-500",
  wait: "bg-amber-400 dark:bg-amber-500",
  cook: "bg-orange-500 dark:bg-orange-500",
};

const SEGMENT_TEXT: Record<TimelineSegmentKind, string> = {
  prep: "text-sky-900 dark:text-sky-100",
  wait: "text-amber-900 dark:text-amber-100",
  cook: "text-orange-900 dark:text-orange-100",
};

const SEGMENT_ICON: Record<TimelineSegmentKind, string> = {
  prep: "🔪",
  wait: "⏳",
  cook: "🔥",
};

/**
 * Tarif zaman cizelgesi: Hazirlik, Bekleme/Marine, Pisirme segmentleri
 * orantili bar olarak gosterilir. Sauerbraten gibi uzun marine tariflerde
 * kullanici "buna gercekten 3 gun lazim" gorsel olarak anliyor (oturum
 * 23 yeni feature).
 *
 * Bekleme segmenti opsiyonel: totalMinutes <= prep + cook ise gosterilmez
 * (mesela menemen, 5dk prep + 15dk cook = 20dk total, marine yok).
 *
 * Server component (state yok). Tooltip CSS-only "title" attribute.
 */
export function RecipeTimeline({
  prepMinutes,
  cookMinutes,
  totalMinutes,
}: RecipeTimelineProps) {
  const data = computeTimeline({ prepMinutes, cookMinutes, totalMinutes });
  if (data.segments.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-text-muted">
          Zaman çizelgesi
        </h3>
        <span className="text-xs text-text-muted">
          Toplam {formatTimelineMinutes(data.totalMinutes)}
        </span>
      </div>

      {/* Bar */}
      <div
        role="img"
        aria-label={`Tarif zaman cizelgesi, ${data.segments
          .map((s) => `${s.label} ${formatTimelineMinutes(s.minutes)}`)
          .join(", ")}`}
        className="flex h-6 w-full overflow-hidden rounded-full bg-bg-elevated"
      >
        {data.segments.map((s, i) => (
          <div
            key={`${s.kind}-${i}`}
            className={`flex h-full items-center justify-center ${SEGMENT_STYLE[s.kind]}`}
            style={{ width: `${s.widthPercent}%` }}
            title={`${s.label}: ${formatTimelineMinutes(s.minutes)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        {data.segments.map((s, i) => (
          <li
            key={`legend-${s.kind}-${i}`}
            className="flex items-center gap-2"
          >
            <span
              aria-hidden
              className={`inline-block h-3 w-3 rounded-full ${SEGMENT_STYLE[s.kind]}`}
            />
            <span aria-hidden className="text-base">
              {SEGMENT_ICON[s.kind]}
            </span>
            <span className={`font-medium ${SEGMENT_TEXT[s.kind]}`}>
              {s.label}
            </span>
            <span className="ml-auto text-xs text-text-muted">
              {formatTimelineMinutes(s.minutes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
