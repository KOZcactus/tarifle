import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ProfileActivityItem } from "@/lib/queries/user";

interface ProfileActivityProps {
  items: readonly ProfileActivityItem[];
  /** Locale-aware tarih formatı için caller'dan t */
  formatRelative: (date: Date) => string;
}

/**
 * Son aktivite timeline, uyarlama, yorum ve koleksiyon eventlerinden
 * en yeni 8 kaydı kronolojik listeler. Her satır tıklanabilir deep-link.
 *
 * Boş listede section render etmez, kullanıcı henüz aktif değilse
 * profilde "son aktivite yok" gürültüsü oluşturmasın.
 */
export async function ProfileActivity({
  items,
  formatRelative,
}: ProfileActivityProps) {
  if (items.length === 0) return null;
  const t = await getTranslations("profile.activity");

  const kindLabels = {
    variation: { label: t("kindVariation"), emoji: "🔄" },
    review: { label: t("kindReview"), emoji: "⭐" },
    collection: { label: t("kindCollection"), emoji: "📚" },
  } as const;

  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl font-bold text-text">
        {t("heading")}
      </h2>

      <ol className="space-y-2">
        {items.map((item) => {
          const meta = kindLabels[item.kind];
          return (
            <li key={`${item.kind}-${item.id}`}>
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-lg border border-border bg-bg-card p-3 transition-colors hover:border-primary/40 hover:bg-bg-elevated"
              >
                {/* Kind + emoji, icon chip, sol tarafta sabit genişlik */}
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm"
                  title={meta.label}
                  aria-label={meta.label}
                >
                  <span aria-hidden="true">{item.emoji ?? meta.emoji}</span>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {item.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                    <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      {meta.label}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={item.at.toISOString()}>
                      {formatRelative(item.at)}
                    </time>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
