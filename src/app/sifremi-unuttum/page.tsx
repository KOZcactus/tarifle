import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.forgotPassword");
  return {
    title: t("title"),
    description: t("description"),
    // Sıfırlama sayfalarını arama motorlarına açmaya gerek yok.
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage() {
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("auth.forgotPassword"),
  ]);
  // Already-signed-in users don't need this flow, the change-password form
  // on /ayarlar is the right place for them.
  if (session) redirect("/ayarlar");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-text">
            {t("pageTitle")}
          </h1>
          <p className="mt-2 text-text-muted">{t("pageSubtitle")}</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
