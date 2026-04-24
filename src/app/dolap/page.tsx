import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPantryAction } from "@/lib/actions/pantry";
import { PantryClient } from "@/components/pantry/PantryClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.pantry");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: { canonical: "/dolap" },
  };
}

/**
 * /dolap, kullanıcının kalıcı pantry yönetimi. Malzeme ekle/sil +
 * miktar + son kullanma tarihi + kategori bazlı gruplama. AI Asistan
 * ve v4 Menü Planlayıcı burada biriken veriyi "🎒 Dolabımı getir"
 * tek tık ile form'a taşır.
 *
 * Auth-gated, misafir kullanıcı /giris'e yönlendirilir.
 */
export default async function PantryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/giris?callbackUrl=/dolap");
  }

  const [res, t, userPrefs] = await Promise.all([
    getUserPantryAction(),
    getTranslations("pantry"),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pantryExpiryTracking: true },
    }),
  ]);

  const items = res.success && res.data ? res.data : [];
  const showExpiry = userPrefs?.pantryExpiryTracking ?? false;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
          {t("headerLabel")}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
          🎒 {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-muted">{t("subtitle")}</p>
      </header>
      <PantryClient initialItems={items} showExpiry={showExpiry} />
    </main>
  );
}
