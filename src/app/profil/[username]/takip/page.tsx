import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getUserByUsername } from "@/lib/queries/user";
import {
  getFollowingList,
  getFollowingUserIds,
} from "@/lib/queries/follow";
import { FollowUserCard } from "@/components/profile/FollowUserCard";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const t = await getTranslations("profile.followList");
  return {
    title: t("followingPageTitle", { username }),
    robots: { index: false, follow: true },
    alternates: { canonical: `/profil/${username}/takip` },
  };
}

export default async function FollowingPage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();
  const user = await getUserByUsername(username, session?.user?.id);
  if (!user) notFound();

  const [following, viewerFollowingIds, t, tCount] = await Promise.all([
    getFollowingList(user.id, 100),
    session?.user?.id
      ? getFollowingUserIds(session.user.id)
      : Promise.resolve<string[]>([]),
    getTranslations("profile.followList"),
    getTranslations("profile"),
  ]);

  const viewerFollowingSet = new Set(viewerFollowingIds);
  const signedIn = !!session?.user?.id;
  const viewerId = session?.user?.id ?? null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href={`/profil/${username}`} className="hover:text-primary">
          ← {t("backToProfile", { name: user.name ?? username })}
        </Link>
      </nav>
      <header className="mb-6 border-b border-border pb-4">
        <h1 className="font-heading text-2xl font-bold text-text">
          {t("followingHeading", { name: user.name ?? `@${username}` })}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {tCount("followingCount", { count: following.length })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={`/profil/${username}/takipciler`}
            className="rounded-full border border-border px-3 py-1 text-text-muted hover:border-primary hover:text-primary"
          >
            {t("tabFollowers")}
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
            {t("tabFollowing")}
          </span>
        </div>
      </header>

      {following.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-bg-card/40 p-6 text-center text-sm text-text-muted">
          {t("followingEmpty", { name: user.name ?? `@${username}` })}
        </p>
      ) : (
        <ul className="space-y-3">
          {following.map((item) => (
            <li key={item.id}>
              <FollowUserCard
                userId={item.id}
                username={item.username}
                name={item.name}
                avatarUrl={item.avatarUrl}
                bio={item.bio}
                secondaryLine={t("variationsBadge", {
                  count: item.variationCount,
                })}
                showFollowButton={viewerId !== item.id}
                viewerSignedIn={signedIn}
                viewerFollows={viewerFollowingSet.has(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
