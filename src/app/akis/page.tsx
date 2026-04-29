import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getFollowFeedVariations } from "@/lib/queries/follow";
import { buildLanguageAlternates } from "@/lib/seo/hreflang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("feed");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    // Feed sayfası kişiye özel + anonymous için yönlendirme yapıyoruz.
    robots: { index: false, follow: true },
    alternates: { canonical: "/akis", languages: buildLanguageAlternates("/akis") },
  };
}

/**
 * `/akis`, takip edilen kullanıcıların son 30 günlük PUBLISHED
 * uyarlama akışı.
 *
 * Anonymous: /giris'e yönlendirir (feed login-gated).
 * Zero-state: kullanıcı kimseyi takip etmiyor veya takip edilenler son
 * 30 günde uyarlama paylaşmadı → "Henüz içerik yok" + öneri CTA.
 */
export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris?callbackUrl=/akis");

  const [items, t, tDate] = await Promise.all([
    getFollowFeedVariations(session.user.id, 40),
    getTranslations("feed"),
    getTranslations("relativeDate"),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          {t("subtitle")}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/50 p-8 text-center">
          <p className="font-heading text-lg font-semibold text-text">
            {t("emptyTitle")}
          </p>
          <p className="mt-2 text-sm text-text-muted">{t("emptyBody")}</p>
          <Link
            href="/tarifler"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <ol className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border bg-bg-card p-5"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <Link
                  href={`/profil/${item.author.username}`}
                  className="inline-flex items-center gap-2 font-semibold text-text hover:text-primary"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                    aria-hidden="true"
                  >
                    {item.author.name?.charAt(0).toUpperCase() ??
                      item.author.username.charAt(0).toUpperCase()}
                  </span>
                  {item.author.name ?? `@${item.author.username}`}
                </Link>
                <span aria-hidden="true">·</span>
                <time dateTime={item.createdAt.toISOString()}>
                  {formatRelative(item.createdAt, tDate)}
                </time>
              </div>
              <Link
                href={`/tarif/${item.recipe.slug}`}
                className="group block"
              >
                <p className="text-xs text-text-muted">
                  {item.recipe.emoji ? `${item.recipe.emoji} ` : ""}
                  {t("recipeLink", { title: item.recipe.title })}
                </p>
                <h2 className="mt-1 font-heading text-lg font-semibold text-text transition-colors group-hover:text-primary">
                  {item.miniTitle}
                </h2>
              </Link>
              {item.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text">
                  {item.description}
                </p>
              )}
              {item.likeCount > 0 && (
                <p className="mt-3 text-xs text-text-muted">
                  ❤️ {t("likeCount", { count: item.likeCount })}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

type RelativeT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

function formatRelative(date: Date, t: RelativeT): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return t("justNow");
    return t("hoursAgo", { n: diffHours });
  }
  if (diffDays === 1) return t("yesterday");
  if (diffDays < 30) return t("daysAgo", { n: diffDays });
  const diffMonths = Math.floor(diffDays / 30);
  return t("monthsAgo", { n: diffMonths });
}
