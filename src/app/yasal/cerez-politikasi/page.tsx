import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LegalDocMeta } from "@/components/legal/LegalDocMeta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return {
    title: t("cookiesTitle"),
    description: t("cookiesDescription"),
    alternates: { canonical: "/yasal/cerez-politikasi" },
  };
}

export default async function CerezPolitikasiPage() {
  const t = await getTranslations("legalCookies");

  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
        <LegalDocMeta version="1.0" lastUpdate="19 Nisan 2026" />
        <p className="mt-3 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("introHeading")}
          </h2>
          <p>{t("introBody")}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">
            {t("typesHeading")}
          </h2>

          <h3 className="mb-1 mt-2 text-base font-semibold text-text">
            {t("essentialHeading")}
          </h3>
          <p className="mb-2">{t("essentialBody")}</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              <code className="rounded bg-bg-card px-1.5 py-0.5 text-xs text-text">
                authjs.session-token
              </code>{" "}
              — {t("essentialSession")}
            </li>
            <li>
              <code className="rounded bg-bg-card px-1.5 py-0.5 text-xs text-text">
                authjs.csrf-token
              </code>{" "}
              — {t("essentialCsrf")}
            </li>
            <li>
              <code className="rounded bg-bg-card px-1.5 py-0.5 text-xs text-text">
                NEXT_LOCALE
              </code>{" "}
              — {t("essentialLocale")}
            </li>
            <li>
              <code className="rounded bg-bg-card px-1.5 py-0.5 text-xs text-text">
                theme
              </code>{" "}
              — {t("essentialTheme")}
            </li>
          </ul>

          <h3 className="mb-1 mt-5 text-base font-semibold text-text">
            {t("functionalHeading")}
          </h3>
          <p className="mb-2">{t("functionalBody")}</p>
          <p className="text-xs">
            <em>{t("functionalPrefsHint")}</em>
          </p>
        </section>

        {/* Privacy duruşu bölümü — "Kullanmadıklarımız" bir özellik listesi
            değil, Tarifle'nin tracking-yok prensibinin manifestosu. Görsel
            olarak diğer section'lardan ayrılsın diye accent-green border +
            privacy icon. */}
        <section className="rounded-xl border border-accent-green/30 bg-accent-green/5 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-text">
            <span aria-hidden="true">🕵️</span>
            {t("noTrackingHeading")}
          </h2>
          <p className="leading-relaxed text-text">{t("noTrackingBody")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("controlHeading")}
          </h2>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>{t("controlBrowser")}</li>
            <li>{t("controlDelete")}</li>
            <li>
              <strong className="text-text">{t("controlImpactLabel")}</strong>{" "}
              {t("controlImpact")}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("updateHeading")}
          </h2>
          <p>{t("updateBody")}</p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          Detaylı veri işleme bilgisi için{" "}
          <Link
            href="/yasal/gizlilik"
            className="text-primary underline-offset-4 hover:underline"
          >
            Gizlilik Politikası
          </Link>{" "}
          ve{" "}
          <Link
            href="/yasal/kvkk"
            className="text-primary underline-offset-4 hover:underline"
          >
            KVKK Aydınlatma Metni
          </Link>{" "}
          sayfalarına göz atabilirsin.
        </p>
      </div>
    </article>
  );
}
