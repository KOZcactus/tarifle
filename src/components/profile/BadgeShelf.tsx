import type { BadgeKey } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { BADGES } from "@/lib/badges/config";
import { formatDistanceToNow } from "@/lib/utils";

interface BadgeShelfProps {
  badges: { key: BadgeKey; awardedAt: Date }[];
}

const TONE_CLASSES: Record<string, string> = {
  blue: "border-accent-blue/30 bg-accent-blue/5 text-accent-blue",
  green: "border-accent-green/30 bg-accent-green/5 text-accent-green",
  gold: "border-secondary/30 bg-secondary/5 text-secondary",
  primary: "border-primary/30 bg-primary/5 text-primary",
};

/**
 * Rozet vitrini, eski yatay chip dizisi yerine 2-3-4 column kart grid.
 * Her kart: büyük emoji + label + açıklama + kazanılma tarihi. Kullanıcı
 * profiline geldiğinde rozetleri "koleksiyon" gibi görsel olarak algılar;
 * küçük chip'ler kalabalık izlenimi veriyordu.
 *
 * Boş rozet listesinde hiç section render etmez, yeni kullanıcıda
 * "henüz rozet yok" placeholder gürültü olur.
 */
export async function BadgeShelf({ badges }: BadgeShelfProps) {
  if (badges.length === 0) return null;
  const t = await getTranslations("profile.badges");

  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl font-bold text-text">
        {t("heading")}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map(({ key, awardedAt }) => {
          const meta = BADGES[key];
          if (!meta) return null;
          const toneClass =
            TONE_CLASSES[meta.tone] ?? TONE_CLASSES.primary;
          return (
            <li
              key={key}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 ${toneClass}`}
            >
              <span
                aria-hidden="true"
                className="text-3xl leading-none"
              >
                {meta.emoji}
              </span>
              <p className="font-heading text-sm font-semibold text-text">
                {meta.label}
              </p>
              <p className="line-clamp-2 text-xs text-text-muted">
                {meta.description}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-text-muted">
                {t("awardedPrefix")} {formatDistanceToNow(awardedAt)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
