import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";

export const metadata: Metadata = {
  title: "Ayarlar",
  robots: { index: false, follow: false },
};

// Personal settings — never prerender.
export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
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
    },
  });
  if (!user) {
    redirect("/giris");
  }

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

      <ProfileSettingsForm
        initialName={user.name ?? ""}
        initialUsername={user.username}
        initialBio={user.bio ?? ""}
        email={user.email}
        emailVerified={!!user.emailVerified}
      />
    </div>
  );
}
