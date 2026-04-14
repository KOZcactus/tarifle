import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { GoogleLinkCard } from "@/components/profile/GoogleLinkCard";

export const metadata: Metadata = {
  title: "Ayarlar",
  robots: { index: false, follow: false },
};

// Personal settings — never prerender.
export const dynamic = "force-dynamic";

interface AyarlarPageProps {
  searchParams: Promise<{ linked?: string; linkError?: string }>;
}

export default async function AyarlarPage({ searchParams }: AyarlarPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/giris?callbackUrl=/ayarlar");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      emailVerified: true,
      accounts: {
        where: { provider: "google" },
        select: { id: true },
      },
    },
  });
  if (!user) {
    redirect("/giris");
  }

  const { linked, linkError } = await searchParams;
  const linkResult =
    linked === "1"
      ? "success"
      : linkError === "mismatch"
        ? "mismatch"
        : linkError === "session"
          ? "session"
          : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">
          Profil ayarları
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          İsmini, kullanıcı adını ve biyografini buradan güncelleyebilirsin.
          Kullanıcı adın profil URL&apos;inde görünür.
        </p>
      </header>

      <div className="space-y-6">
        <ProfileSettingsForm
          initialName={user.name ?? ""}
          initialUsername={user.username}
          initialBio={user.bio ?? ""}
          email={user.email}
          emailVerified={!!user.emailVerified}
        />

        <GoogleLinkCard
          linked={user.accounts.length > 0}
          email={user.email}
          linkResult={linkResult}
        />
      </div>
    </div>
  );
}
