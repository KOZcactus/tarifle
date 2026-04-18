import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.register");
  return { title: t("title"), description: t("description") };
}

export default async function RegisterPage() {
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("auth.register"),
  ]);
  if (session) redirect("/");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-3xl font-bold text-text">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </div>
        <div className="mb-8 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("benefitsTitle")}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-text">
            {(["benefit1", "benefit2", "benefit3", "benefit4"] as const).map(
              (key) => (
                <li key={key} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-0.5 text-primary">✓</span>
                  <span>{t(key)}</span>
                </li>
              ),
            )}
          </ul>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
