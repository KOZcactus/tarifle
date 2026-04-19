import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return {
    title: t("hubTitle"),
    description: t("hubDescription"),
    alternates: { canonical: "/yasal" },
  };
}

/**
 * Legal hub landing — her alt sayfaya giden kart grid'i. Kullanıcı
 * hangi sayfayı arıyor net değilse buradan başlar; sidebar navigation
 * her sub-route'ta zaten mevcut ama hub kendi-başına bir "içindekiler"
 * sayfası olarak çalışır.
 */
export default async function YasalHubPage() {
  const t = await getTranslations("legalHub");

  const cards = [
    { href: "/yasal/kvkk", id: "kvkk" },
    { href: "/yasal/kullanim-kosullari", id: "kullanim" },
    { href: "/yasal/gizlilik", id: "gizlilik" },
    { href: "/yasal/cerez-politikasi", id: "cerez" },
    { href: "/yasal/guvenlik", id: "guvenlik" },
  ] as const;

  return (
    <article>
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.id}>
            <Link
              href={c.href}
              className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-primary hover:bg-bg-elevated"
            >
              <h2 className="font-heading text-base font-semibold text-text group-hover:text-primary">
                {t(`cards.${c.id}.title`)}
              </h2>
              <p className="text-xs text-text-muted">
                {t(`cards.${c.id}.description`)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
