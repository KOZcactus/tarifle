import { getTranslations } from "next-intl/server";
import type { ProfileStats as ProfileStatsData } from "@/lib/queries/user";

interface ProfileStatsProps {
  stats: ProfileStatsData;
}

/**
 * Profil header'ın altında 4 stat card'lık vitrin. Mevcut inline
 * satır formatı ("X uyarlama · Y bookmark · üye tarihi") yerine
 * dashboard tarzı rakam + label grid'i — kullanıcı profili zenginleşir,
 * contribution sinyali görsel olarak da verilir.
 *
 * Bookmark + email gibi özel sayılar header'da owner-only kalır;
 * buradaki tüm sayılar PUBLIC aggregated değerlerdir.
 */
export async function ProfileStats({ stats }: ProfileStatsProps) {
  const t = await getTranslations("profile.stats");

  const items = [
    {
      key: "variations",
      value: stats.publishedVariations,
      label: t("variations"),
      emoji: "🔄",
    },
    {
      key: "likes",
      value: stats.totalLikesReceived,
      label: t("likesReceived"),
      emoji: "❤️",
    },
    {
      key: "reviews",
      value: stats.publishedReviews,
      label: t("reviews"),
      emoji: "⭐",
    },
    {
      key: "collections",
      value: stats.publicCollections,
      label: t("collections"),
      emoji: "📚",
    },
  ] as const;

  return (
    <section className="mb-10">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-border bg-bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {item.label}
              </dt>
              <span aria-hidden="true" className="text-lg">
                {item.emoji}
              </span>
            </div>
            <dd className="mt-2 font-heading text-2xl font-bold tabular-nums text-text">
              {item.value.toLocaleString("tr-TR")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
