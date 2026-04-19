import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FollowUserCard } from "@/components/profile/FollowUserCard";
import type { SuggestedCook } from "@/lib/queries/follow";

interface SuggestedCooksSectionProps {
  cooks: SuggestedCook[];
  viewerSignedIn: boolean;
  viewerId: string | null;
  viewerFollowingIds: Set<string>;
}

/**
 * Homepage "Önerilen Aşçılar" bloğu — son 30 günde aktif + takipçili 6
 * user. `FollowUserCard` paylaşımlı grid kartı kullanılıyor. Anonim
 * kullanıcı için de gözüküyor (discovery); Follow butonu click anında
 * `/giris`'e yönlendirir.
 */
export async function SuggestedCooksSection({
  cooks,
  viewerSignedIn,
  viewerId,
  viewerFollowingIds,
}: SuggestedCooksSectionProps) {
  if (cooks.length === 0) return null;
  const t = await getTranslations("home.suggestedCooks");
  const tList = await getTranslations("profile.followList");

  return (
    <section className="py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">{t("heading")}</h2>
          <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href="/tarifler?siralama=author-activity"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t("viewAll")} →
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cooks.map((cook) => (
          <FollowUserCard
            key={cook.id}
            userId={cook.id}
            username={cook.username}
            name={cook.name}
            avatarUrl={cook.avatarUrl}
            bio={cook.bio}
            secondaryLine={`${tList("followersBadge", { count: cook.followerCount })} · ${tList("variationsBadge", { count: cook.variationCount })}`}
            showFollowButton={viewerId !== cook.id}
            viewerSignedIn={viewerSignedIn}
            viewerFollows={viewerFollowingIds.has(cook.id)}
          />
        ))}
      </div>
    </section>
  );
}
