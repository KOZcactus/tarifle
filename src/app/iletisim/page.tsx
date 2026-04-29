import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { isValidLocale, type Locale } from "@/i18n/config";
import { buildLanguageAlternates } from "@/lib/seo/hreflang";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "tr";
  const t = await getTranslations({ locale, namespace: "metadata.contact" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/iletisim", languages: buildLanguageAlternates("/iletisim") },
  };
}

export default async function IletisimPage() {
  const t = await getTranslations("iletisim");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-text-muted">{t("subtitle")}</p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-text">{t("emailHeading")}</h2>
          <p className="mt-2 text-sm text-text-muted">{t("emailHelp")}</p>
          <a
            href="mailto:iletisim@tarifle.app"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            iletisim@tarifle.app
          </a>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text">{t("kvkkHeading")}</h2>
          <p className="mt-2 text-sm text-text-muted">{t("kvkkHelp")}</p>
          <a
            href="mailto:kvkk@tarifle.app?subject=KVKK%20Veri%20Talebi"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            kvkk@tarifle.app
          </a>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text">{t("moderationHeading")}</h2>
          <p className="mt-2 text-sm text-text-muted">{t("moderationHelp")}</p>
        </section>

        <section className="rounded-lg border border-border bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text">{t("responseNoteHeading")}</h2>
          <p className="mt-2 text-sm text-text-muted">{t("responseNote")}</p>
        </section>

        {/* Aydınlatma metni referansı, iletişim bir veri işleme
            noktası olduğu için KVKK şeffaflık yükümlülüğü kapsamında
            mail yazmadan önce kullanıcıya aydınlatma linki sunulur.
            Form olsaydı checkbox ile onay alırdık; mailto olduğu için
            pasif bilgilendirme yeterli. */}
        <section className="rounded-lg border border-primary/30 bg-primary/5 p-5">
          <h2 className="text-sm font-semibold text-text">
            {t("privacyNoticeHeading")}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {t("privacyNoticeBody")}{" "}
            <Link
              href="/yasal/iletisim-aydinlatma"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("privacyNoticeLink")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
