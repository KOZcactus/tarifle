import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("newsletter.confirmed");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function NewsletterConfirmedPage() {
  const t = await getTranslations("newsletter.confirmed");
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-2xl border border-accent-green/30 bg-accent-green/5 p-8">
        <div className="mb-3 text-4xl" aria-hidden="true">
          ✅
        </div>
        <h1 className="font-heading text-2xl font-bold">{t("heading")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          {t("body")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          {t("home")} →
        </Link>
      </div>
    </div>
  );
}
