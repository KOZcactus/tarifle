"use client";

import { useTranslations } from "next-intl";

interface HungerBarProps {
  /** 1-10 integer tokluk puanı. Null gelirse component render etmez. */
  value: number | null;
  /** Opsiyonel compact mod, kartlarda daha küçük görüntü için. */
  compact?: boolean;
}

/**
 * Açlık barı, Minecraft-esin tokluk göstergesi. Dolu 🍖 + boş 🦴.
 * Porsiyon başı tokluk puanını gösterir (1-10). Tooltip'de bucket
 * açıklaması var (az / orta / çok / uzun süre tok).
 */
export function HungerBar({ value, compact = false }: HungerBarProps) {
  const t = useTranslations("recipe.hungerBar");

  if (value == null) return null;
  const clamped = Math.max(1, Math.min(10, Math.round(value)));

  const bucketKey =
    clamped <= 2 ? "bucketLow" : clamped <= 5 ? "bucketMid" : clamped <= 8 ? "bucketHigh" : "bucketMax";
  const bucketText = t(bucketKey);
  const tooltip = t("tooltip", { value: clamped, bucket: bucketText });

  const filled = "🍖".repeat(clamped);
  const empty = "🦴".repeat(10 - clamped);

  if (compact) {
    return (
      <span
        aria-label={tooltip}
        title={tooltip}
        className="inline-flex items-center gap-1 text-xs"
      >
        <span aria-hidden>{filled}{empty}</span>
        <span className="text-text-muted">{clamped}/10</span>
      </span>
    );
  }

  return (
    <div
      className="rounded-xl border border-border bg-bg-card p-4"
      aria-label={tooltip}
      title={tooltip}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-muted">{t("title")}</h3>
        <span className="text-sm font-semibold text-text-primary">
          {clamped}/10
        </span>
      </div>
      <div className="text-2xl leading-none tracking-tight" aria-hidden>
        {filled}
        {empty}
      </div>
      <p className="mt-2 text-xs text-text-muted">{bucketText}</p>
    </div>
  );
}
