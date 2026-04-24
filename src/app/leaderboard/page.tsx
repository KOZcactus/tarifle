import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLeaderboard, type ScorePeriod } from "@/lib/leaderboard/score";
import { isLeaderboardEnabled } from "@/lib/site-settings";

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

const VALID_PERIODS = ["WEEKLY", "MONTHLY", "ALL_TIME"] as const;

function parsePeriod(value: string | undefined): ScorePeriod {
  const upper = value?.toUpperCase();
  if (upper === "MONTHLY" || upper === "ALL_TIME") return upper;
  return "WEEKLY";
}

export async function generateMetadata(): Promise<Metadata> {
  const [t, enabled] = await Promise.all([
    getTranslations("metadata.leaderboard"),
    isLeaderboardEnabled(),
  ]);
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/leaderboard" },
    // Feature flag kapalıyken sayfa 404 verir, aynı zamanda meta
    // robots noindex ile arama motorlarına da "yok" diyor.
    robots: enabled
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

/**
 * Liderlik tablosu, Faz 1 topluluk skor gösterimi. 3 pencere (haftalık /
 * aylık / tüm zamanlar), her biri top 10-50 kullanıcı + skor + kısa
 * etkinlik özeti. Real-time hesap (unstable_cache 15 dk TTL).
 *
 * Skor docs/TARIFLE_ULTIMATE_PLAN.md §35'de tanımlı:
 *   uyarlama × 3 + beğeni × 1 + review rating × 2 + fotoğraf × 2
 *   + editor_choice × 10
 *
 * Kullanıcı profiline deep link; rozet + skor satırı orada da görünür.
 */
export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  // Feature flag kapalı ise sayfa 404. Admin /admin/ayarlar'dan
  // açtığında anında görünür hale gelir (cache 60s TTL).
  const enabled = await isLeaderboardEnabled();
  if (!enabled) notFound();

  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const [entries, t] = await Promise.all([
    getLeaderboard(period, period === "ALL_TIME" ? 50 : 10),
    getTranslations("leaderboard"),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-muted">{t("pageSubtitle")}</p>
      </header>

      {/* Period tab switcher */}
      <nav
        aria-label={t("periodAriaLabel")}
        className="mb-6 flex flex-wrap gap-2 border-b border-border"
      >
        {VALID_PERIODS.map((p) => {
          const isActive = p === period;
          const href =
            p === "WEEKLY" ? "/leaderboard" : `/leaderboard?period=${p.toLowerCase()}`;
          return (
            <Link
              key={p}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t(`period.${p.toLowerCase()}`)}
            </Link>
          );
        })}
      </nav>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <h2 className="font-heading text-lg font-semibold text-text">
            {t("emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-text-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            return (
              <li
                key={entry.userId}
                className="flex items-center gap-4 rounded-xl border border-border bg-bg-card p-4 transition-colors hover:border-primary/50"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    rank === 1
                      ? "bg-primary text-white"
                      : rank <= 3
                        ? "bg-primary/15 text-primary"
                        : "bg-bg-elevated text-text-muted"
                  }`}
                >
                  {rank}
                </span>
                <Link
                  href={`/profil/${entry.username}`}
                  className="flex flex-1 items-center gap-3 group"
                >
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt={entry.name ?? entry.username}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated text-lg"
                    >
                      👤
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text group-hover:text-primary">
                      {entry.name || entry.username}
                    </p>
                    <p className="text-xs text-text-muted">
                      @{entry.username}
                    </p>
                  </div>
                </Link>
                <div className="text-right">
                  <p className="font-heading text-lg font-bold text-primary">
                    {entry.score.toLocaleString("tr-TR")}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {t("activitySummary", {
                      variations: entry.variationCount,
                      likes: entry.likeCount,
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-8 rounded-lg border border-dashed border-border bg-bg p-4 text-xs text-text-muted">
        {t.rich("scoreFormula", {
          bold: (chunks) => <strong className="text-text">{chunks}</strong>,
        })}
      </p>
    </main>
  );
}
