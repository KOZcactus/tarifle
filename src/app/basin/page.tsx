/**
 * Basın kit (press kit) sayfası, /basin route.
 *
 * Yazarlar, blogger'lar, gazeteciler için Tarifle hakkında hazır
 * içerik + faktoid + iletişim. Web launch playbook §1
 * (docs/FUTURE_PLANS.md).
 *
 * Phase 0 stub: temel içerik live. Launch sprint öncesi T-7 günde:
 * - Logo paketi zip linki ek (public/press-kit.zip)
 * - Hero ekran görüntüleri (5+ screenshot)
 * - Ekip + kuruluş hikayesi metni dolduruldu
 * - Demo video link (opsiyonel)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { buildLanguageAlternates } from "@/lib/seo/hreflang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("press");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "/basin",
      languages: buildLanguageAlternates("/basin"),
    },
    openGraph: {
      title: `${t("metaTitle")} | ${SITE_NAME}`,
      description: t("metaDescription"),
      url: `${SITE_URL}/basin`,
      type: "website",
    },
  };
}

interface Faktoid {
  label: string;
  value: string;
}

const faktoids: Faktoid[] = [
  { label: "Tarif sayısı", value: "3700+" },
  { label: "Mutfak", value: "41" },
  { label: "Kategori", value: "17" },
  { label: "Blog yazısı", value: "61" },
  { label: "Diller", value: "TR + EN" },
  { label: "Allergen filtresi", value: "10 kategori" },
  { label: "Diyet preset", value: "10 (vegan, keto, akdeniz, vd.)" },
  { label: "Lansman", value: "Yakında, Türkiye" },
];

export default async function BasinPage() {
  const t = await getTranslations("press");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-12">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-4xl font-bold text-text">
          {t("h1")}
        </h1>
        <p className="mt-4 text-lg text-text-muted">{t("lead")}</p>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
          {t("pitchTitle")}
        </h2>
        <p className="text-base leading-relaxed text-text">{t("pitchOneLine")}</p>
        <p className="mt-4 text-base leading-relaxed text-text">
          {t("pitchParagraph")}
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
          {t("storyTitle")}
        </h2>
        <p className="text-base leading-relaxed text-text">{t("storyParagraph")}</p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
          {t("faktoidsTitle")}
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {faktoids.map((f) => (
            <div
              key={f.label}
              className="rounded-lg border border-border bg-bg-card p-4"
            >
              <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {f.label}
              </dt>
              <dd className="mt-1 font-heading text-2xl font-bold text-primary">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
          {t("brandAssetsTitle")}
        </h2>
        <p className="text-base leading-relaxed text-text">
          {t("brandAssetsDescription")}
        </p>
        <p className="mt-6">
          <a
            href="/press-kit.zip"
            download
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            {t("brandAssetsDownload")}
          </a>
        </p>
        <p className="mt-3 text-sm text-text-muted">{t("brandAssetsNote")}</p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
          {t("highlightsTitle")}
        </h2>
        <ul className="space-y-3 text-base text-text">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{t("highlight1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{t("highlight2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{t("highlight3")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{t("highlight4")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{t("highlight5")}</span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
          {t("contactTitle")}
        </h2>
        <p className="text-base leading-relaxed text-text">
          {t("contactDescription")}
        </p>
        <p className="mt-4 text-base text-text">
          <a
            href="mailto:basin@tarifle.app"
            className="font-medium text-primary hover:text-primary-hover"
          >
            basin@tarifle.app
          </a>
        </p>
        <p className="mt-2 text-sm text-text-muted">
          {t("contactNote")}{" "}
          <Link
            href="/iletisim"
            className="font-medium text-primary hover:text-primary-hover"
          >
            /iletisim
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
