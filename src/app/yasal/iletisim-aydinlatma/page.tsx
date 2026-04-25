import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LegalDocMeta } from "@/components/legal/LegalDocMeta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return {
    title: t("contactNoticeTitle"),
    description: t("contactNoticeDescription"),
    alternates: { canonical: "/yasal/iletisim-aydinlatma" },
  };
}

export default async function IletisimAydinlatmaPage() {
  const t = await getTranslations("legalContactNotice");

  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
        <LegalDocMeta version="1.1" lastUpdate="26 Nisan 2026" />
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          {t("subtitle")}
        </p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("kapsamHeading")}
          </h2>
          <p>{t("kapsamBody")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("dataHeading")}
          </h2>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>{t("dataName")}</li>
            <li>{t("dataEmail")}</li>
            <li>{t("dataMessage")}</li>
            <li>{t("dataHeaders")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("purposeHeading")}
          </h2>
          <ul className="ml-4 list-disc space-y-2">
            <li>{t("purposeResponse")}</li>
            <li>{t("purposeLegal")}</li>
            <li>{t("purposeSpam")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("retentionHeading")}
          </h2>
          <p>{t("retentionBody")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("transferHeading")}
          </h2>
          <p>{t("transferBody")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            {t("rightsHeading")}
          </h2>
          <p>{t("rightsBody")}</p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          {t("crosslinkLead")}{" "}
          <Link
            href="/yasal/kvkk"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("crosslinkKvkk")}
          </Link>
          ,{" "}
          <Link
            href="/yasal/gizlilik"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("crosslinkGizlilik")}
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
