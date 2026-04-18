import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { consumeVerificationToken } from "@/lib/email/verification";

export const metadata: Metadata = {
  title: "E-posta Doğrulama",
  // Doğrulama linkleri Google'a sızmasın diye index'leme
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { token } = await params;
  const [result, t] = await Promise.all([
    consumeVerificationToken(token),
    getTranslations("auth.verifyEmail"),
  ]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      {result.success ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15 text-3xl">
            ✓
          </div>
          <h1 className="font-heading text-2xl font-bold text-text">
            {t("successTitle")}
          </h1>
          <p className="mt-2 text-text-muted">
            {t.rich("successBody", {
              email: () => <strong>{result.email}</strong>,
            })}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t("homeLink")}
          </Link>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/15 text-3xl text-error">
            ⚠
          </div>
          <h1 className="font-heading text-2xl font-bold text-text">
            {t("failTitle")}
          </h1>
          <p className="mt-2 text-text-muted">
            {result.reason === "expired" ? t("failExpired") : t("failOther")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/giris"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {t("loginLink")}
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-muted hover:text-text"
            >
              {t("homeLinkShort")}
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
