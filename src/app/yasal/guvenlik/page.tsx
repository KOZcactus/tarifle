import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocMeta } from "@/components/legal/LegalDocMeta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return {
    title: t("securityTitle"),
    description: t("securityDescription"),
    alternates: { canonical: "/yasal/guvenlik" },
  };
}

export default async function GuvenlikPage() {
  const t = await getTranslations("legalSecurity");

  /** "Bizim yaptıklarımız" bölümündeki kartlar, her biri başlık + body
   *  tek paragraf. Trendyol'daki formata sadık ama Tarifle'nin gerçek
   *  teknik önlemleriyle doldurulmuş (bcrypt, Upstash, Cloudflare vb.
   *  gerçekten kullanılan şeyler). Liste halinde tekrar önlemek için
   *  data-driven render ediliyor. */
  const usItems = [
    { titleKey: "httpsHeading", bodyKey: "httpsBody", emoji: "🔒" },
    { titleKey: "passwordHashHeading", bodyKey: "passwordHashBody", emoji: "🔑" },
    { titleKey: "emailVerifyHeading", bodyKey: "emailVerifyBody", emoji: "✉️" },
    { titleKey: "rateLimitHeading", bodyKey: "rateLimitBody", emoji: "⏱️" },
    { titleKey: "moderationHeading", bodyKey: "moderationBody", emoji: "🛡️" },
    { titleKey: "infraHeading", bodyKey: "infraBody", emoji: "🏗️" },
    { titleKey: "backupHeading", bodyKey: "backupBody", emoji: "💾" },
    { titleKey: "reportHeading", bodyKey: "reportBody", emoji: "🐛" },
  ] as const;

  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
        <LegalDocMeta version="1.0" lastUpdate="19 Nisan 2026" />
        <p className="mt-3 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      {/* Sen, kullanıcının yapabilecekleri. Hesap + cihaz olmak üzere
          iki alt başlık. Her madde tek cümle, tarama kolay. */}
      <section>
        <h2 className="font-heading text-xl font-semibold text-text">
          {t("youSection")}
        </h2>

        <div className="mt-4 space-y-5 text-sm leading-relaxed text-text-muted">
          <div>
            <h3 className="mb-2 text-base font-semibold text-text">
              {t("accountHeading")}
            </h3>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>{t("accountStrongPassword")}</li>
              <li>{t("accountEmailVerify")}</li>
              <li>{t("accountLogout")}</li>
              <li>{t("accountNoShare")}</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-text">
              {t("deviceHeading")}
            </h3>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>{t("deviceDevice")}</li>
              <li>{t("devicePhishing")}</li>
              <li>{t("deviceAntivirus")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Biz, altyapı + süreçsel önlemler. Emoji + başlık + paragraf
          formatı, Trendyol'daki "PCI DSS / ISO 27001" bölümlerine denk.
          Kartlaştırma yapmadık, bilgi yoğun ama okuma akışı daha doğal. */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold text-text">
          {t("usSection")}
        </h2>

        <div className="mt-4 space-y-5 text-sm leading-relaxed text-text-muted">
          {usItems.map(({ titleKey, bodyKey, emoji }) => (
            <div
              key={titleKey}
              className="rounded-xl border border-border bg-bg-card p-4"
            >
              <h3 className="flex items-center gap-2 text-base font-semibold text-text">
                <span aria-hidden="true">{emoji}</span>
                {t(titleKey)}
              </h3>
              <p className="mt-1.5">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
