import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.login");
  // Login sayfası + callbackUrl query variant'ları SEO değeri sıfır,
  // kullanıcıya özel yönlendirme parametresi. Tarif sayfalarındaki
  // "giriş yap" link'leri Google'a /giris?callbackUrl=/tarif/slug
  // kombinasyonlarını ifşa ediyor (GSC 21 Nis 2026: 55 duplicate),
  // canonical + noindex ile crawler'a tek /giris yeterli diyoruz.
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: true },
    alternates: { canonical: "/giris" },
  };
}

export default async function LoginPage() {
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("auth.login"),
  ]);
  if (session) redirect("/");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-text">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
