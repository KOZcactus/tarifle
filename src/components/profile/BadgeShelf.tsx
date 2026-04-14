import type { BadgeKey } from "@prisma/client";
import { BADGES } from "@/lib/badges/config";
import { formatDistanceToNow } from "@/lib/utils";

interface BadgeShelfProps {
  badges: { key: BadgeKey; awardedAt: Date }[];
}

const TONE_CLASSES: Record<string, string> = {
  blue: "bg-accent-blue/10 border-accent-blue/20 text-accent-blue",
  green: "bg-accent-green/10 border-accent-green/20 text-accent-green",
  gold: "bg-secondary/10 border-secondary/20 text-secondary",
  primary: "bg-primary/10 border-primary/20 text-primary",
};

export function BadgeShelf({ badges }: BadgeShelfProps) {
  if (badges.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-heading text-base font-semibold uppercase tracking-wide text-text-muted">
        Rozetler
      </h2>
      <div className="flex flex-wrap gap-2">
        {badges.map(({ key, awardedAt }) => {
          const meta = BADGES[key];
          if (!meta) return null;
          return (
            <div
              key={key}
              title={`${meta.description} · ${formatDistanceToNow(awardedAt)}`}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
                TONE_CLASSES[meta.tone] ?? TONE_CLASSES.primary
              }`}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              <span>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
