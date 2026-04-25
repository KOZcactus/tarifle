import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { GoogleLinkCard } from "@/components/profile/GoogleLinkCard";
import { PasswordChangeCard } from "@/components/profile/PasswordChangeCard";
import { LanguagePreferenceCard } from "@/components/profile/LanguagePreferenceCard";
import { PreferencesCard } from "@/components/profile/PreferencesCard";
import { PrivacyCard } from "@/components/profile/PrivacyCard";
import { PantryPreferencesCard } from "@/components/profile/PantryPreferencesCard";
import { DietPreferenceCard } from "@/components/profile/DietPreferenceCard";
import { InstallAppCard } from "@/components/profile/InstallAppCard";
import { DeleteAccountCard } from "@/components/profile/DeleteAccountCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.settings");
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Personal settings, never prerender.
export const dynamic = "force-dynamic";

interface AyarlarPageProps {
  searchParams: Promise<{ linked?: string; linkError?: string }>;
}

export default async function AyarlarPage({ searchParams }: AyarlarPageProps) {
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("settings"),
  ]);
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
      passwordHash: true,
      favoriteTags: true,
      allergenAvoidances: true,
      favoriteCuisines: true,
      showChefScore: true,
      showActivity: true,
      showFollowCounts: true,
      pantryExpiryTracking: true,
      ttsVoicePreference: true,
      dietProfile: true,
      showDietBadge: true,
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
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t("pageSubtitle")}</p>
      </header>

      <div className="space-y-6">
        {/* Sira mantigi (oturum 21 revize): kullanici geri bildirimi sonrasi
            mantiksal kumeler -- Profil > Hesap > Tercihler > Gizlilik >
            Uygulama > Gorunum > Tehlikeli alan. Dil tercihi her gun
            kullanilmaz, kompakt ve asagida. */}
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
          hasPassword={!!user.passwordHash}
          linkResult={linkResult}
        />

        <PasswordChangeCard hasPassword={!!user.passwordHash} />

        <PreferencesCard
          initialFavoriteTags={user.favoriteTags}
          initialAllergenAvoidances={user.allergenAvoidances}
          initialFavoriteCuisines={user.favoriteCuisines}
        />

        <DietPreferenceCard initialDietProfile={user.dietProfile} />

        <PantryPreferencesCard
          initialPantryExpiryTracking={user.pantryExpiryTracking}
          initialTtsVoicePreference={
            user.ttsVoicePreference === "male" ? "male" : "female"
          }
        />

        <PrivacyCard
          initialShowChefScore={user.showChefScore}
          initialShowActivity={user.showActivity}
          initialShowFollowCounts={user.showFollowCounts}
          initialShowDietBadge={user.showDietBadge}
        />

        <InstallAppCard />

        <LanguagePreferenceCard />

        <DeleteAccountCard
          username={user.username}
          hasPassword={!!user.passwordHash}
        />
      </div>
    </div>
  );
}
