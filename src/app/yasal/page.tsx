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

  // Her kart için küçük bir görsel işaret — emoji tarif platformunun
  // genel dilini korur, ikonlar (SVG) eklemekten daha hızlı çözüm. Renk
  // accent'ı primary bg-tint ile hafif; hover'da kart derinleşir.
  const cards = [
    { href: "/yasal/kvkk", id: "kvkk", emoji: "🇹🇷" },
    { href: "/yasal/kullanim-kosullari", id: "kullanim", emoji: "📋" },
    { href: "/yasal/gizlilik", id: "gizlilik", emoji: "🔐" },
    { href: "/yasal/cerez-politikasi", id: "cerez", emoji: "🍪" },
    { href: "/yasal/guvenlik", id: "guvenlik", emoji: "🛡️" },
  ] as const;

  return (
    <article>
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          {t("subtitle")}
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.id}>
            <Link
              href={c.href}
              className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border bg-bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl transition-colors group-hover:bg-primary/15"
                  aria-hidden="true"
                >
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold text-text transition-colors group-hover:text-primary">
                    {t(`cards.${c.id}.title`)}
                  </h2>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-text-muted">
                {t(`cards.${c.id}.description`)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
