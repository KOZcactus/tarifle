import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isLeaderboardEnabled } from "@/lib/site-settings";
import { LeaderboardFeatureToggle } from "@/components/admin/LeaderboardFeatureToggle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.features");
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

/**
 * Admin Özellik Ayarları: runtime feature flag'leri tek yerden
 * aç/kapat. Şu an leaderboard + (ileride diğer feature toggle'lar).
 * user-photos toggle'ı zaten /admin/topluluk-fotolari içinde kalıyor
 * (moderasyon + toggle aynı sayfa).
 */
export default async function AdminFeaturesPage() {
  const [leaderboardEnabled, t] = await Promise.all([
    isLeaderboardEnabled(),
    getTranslations("admin.features"),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-heading text-xl font-bold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <section className="rounded-xl border border-border bg-bg-card p-5">
        <h3 className="mb-2 font-heading text-base font-semibold">
          {t("leaderboard.heading")}
        </h3>
        <p className="mb-4 text-sm text-text-muted">
          {t("leaderboard.helper")}
        </p>
        <LeaderboardFeatureToggle initialEnabled={leaderboardEnabled} />
        <p className="mt-3 text-xs text-text-muted">
          {t("leaderboard.status", {
            state: leaderboardEnabled
              ? t("leaderboard.stateOn")
              : t("leaderboard.stateOff"),
          })}
        </p>
      </section>
    </div>
  );
}
