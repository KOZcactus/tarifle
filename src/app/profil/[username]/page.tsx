import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import {
  getUserByUsername,
  getUserBookmarks,
  getUserProfileStats,
  getUserVariations,
  getUserReviews,
} from "@/lib/queries/user";
import { getPublicCollections, getUserCollections } from "@/lib/queries/collection";
import { getUserBadges } from "@/lib/badges/service";
import { isValidLocale } from "@/i18n/config";
import { VerifyEmailBanner } from "@/components/auth/VerifyEmailBanner";
import { BadgeShelf } from "@/components/profile/BadgeShelf";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileActivity } from "@/components/profile/ProfileActivity";
import { FollowButton } from "@/components/profile/FollowButton";
import { DeleteOwnVariationButton } from "@/components/recipe/DeleteOwnVariationButton";
import { getFollowCounts, isFollowing } from "@/lib/queries/follow";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

type RelativeT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/** Locale-aware "X gün önce / X days ago" — üye/yorum tarihleri için. */
function formatRelativeDate(date: Date | string, t: RelativeT): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("yesterday");
  if (diffDays < 30) return t("daysAgo", { n: diffDays });
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return t("monthsAgo", { n: diffMonths });
  const diffYears = Math.floor(diffDays / 365);
  return t("yearsAgo", { n: diffYears });
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "Kullanıcı Bulunamadı | Tarifle" };
  return {
    title: `${user.name || user.username} | Tarifle`,
    description: user.bio || `${user.name || user.username} profili`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const [session, t, tDate, localeRaw] = await Promise.all([
    auth(),
    getTranslations("profile"),
    getTranslations("relativeDate"),
    getLocale(),
  ]);
  const user = await getUserByUsername(username, session?.user?.id);

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;
  const locale = isValidLocale(localeRaw) ? localeRaw : "tr";
  void locale;

  const [
    bookmarks,
    variations,
    collections,
    badges,
    reviews,
    profileStats,
    followCounts,
    viewerFollows,
  ] = await Promise.all([
    isOwner ? getUserBookmarks(user.id) : Promise.resolve([]),
    getUserVariations(user.id, isOwner),
    isOwner ? getUserCollections(user.id) : getPublicCollections(user.id),
    getUserBadges(user.id),
    getUserReviews(user.id, isOwner),
    getUserProfileStats(user.id),
    getFollowCounts(user.id),
    session?.user?.id && !isOwner
      ? isFollowing(session.user.id, user.id)
      : Promise.resolve(false),
  ]);

  // Owner-only fields (TS narrowing — only present when isOwner === true)
  const ownerEmail = "email" in user ? (user as { email: string }).email : null;
  const ownerEmailVerified =
    "emailVerified" in user
      ? (user as { emailVerified: Date | null }).emailVerified
      : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {isOwner && ownerEmail && !ownerEmailVerified && (
        <VerifyEmailBanner email={ownerEmail} />
      )}

      {/* Profile Header */}
      <div className="mb-8 flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white">
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-text">
              {user.name || user.username}
            </h1>
            {user.isVerified && (
              <span className="rounded-full bg-accent-blue/10 px-2 py-0.5 text-xs font-medium text-accent-blue">
                {t("teamBadge")}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">@{user.username}</p>
          {user.bio && <p className="mt-2 text-sm text-text">{user.bio}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-muted">
            <span>{t("variationsCount", { count: user._count.variations })}</span>
            <span>{t("followersCount", { count: followCounts.followers })}</span>
            <span>{t("followingCount", { count: followCounts.following })}</span>
            {isOwner && (
              <span>{t("bookmarksCount", { count: user._count.bookmarks })}</span>
            )}
            <span>
              {t("memberSince", { date: formatRelativeDate(user.createdAt, tDate) })}
            </span>
            {!isOwner && (
              <FollowButton
                targetUserId={user.id}
                initialFollowing={viewerFollows}
                signedIn={!!session?.user?.id}
              />
            )}
            {isOwner && (
              <Link
                href="/ayarlar"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                {t("editProfile")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stat vitrini — 4 kart: yayında uyarlama + aldığı beğeni + yayında
          yorum + public koleksiyon. Public aggregated; owner için ek özel
          sayılar header'da. */}
      <ProfileStats stats={profileStats} />

      <BadgeShelf badges={badges} />

      {/* Son aktivite timeline — son 8 event (varyasyon + yorum + public
          koleksiyon) chronological. Yeni kullanıcıda hiç event olmazsa
          section render edilmez. */}
      <ProfileActivity
        items={profileStats.recentActivity}
        formatRelative={(d) => formatRelativeDate(d, tDate)}
      />

      {/* Collections */}
      {(collections.length > 0 || isOwner) && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text">
              {isOwner ? t("collectionsTitleOwner") : t("collectionsTitle")}
            </h2>
            {isOwner && (
              <Link
                href="/alisveris-listesi"
                className="text-sm text-primary hover:text-primary-hover"
              >
                {t("shoppingListLink")}
              </Link>
            )}
          </div>
          {collections.length === 0 ? (
            <p className="text-sm text-text-muted">
              {isOwner ? t("collectionsEmptyOwner") : t("collectionsEmptyPublic")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/koleksiyon/${c.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-bg-card transition-all hover:border-primary"
                >
                  <div className="grid h-32 grid-cols-2 gap-px bg-border">
                    {c.items.length === 0 ? (
                      <div className="col-span-2 flex items-center justify-center bg-bg-elevated text-4xl">
                        {c.emoji ?? "📁"}
                      </div>
                    ) : (
                      Array.from({ length: 4 }).map((_, i) => {
                        const item = c.items[i];
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-center bg-bg-elevated"
                          >
                            {item?.recipe.imageUrl ? (
                              <img
                                src={item.recipe.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">
                                {item?.recipe.emoji ?? ""}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-text transition-colors group-hover:text-primary">
                      {c.emoji && <span className="mr-1">{c.emoji}</span>}
                      {c.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                      <span>{t("collectionRecipeCount", { count: c._count.items })}</span>
                      {c.isPublic && (
                        <span className="rounded-full bg-accent-green/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-green">
                          {t("collectionPublicBadge")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Variations */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-text">{t("variationsTitle")}</h2>
        {variations.length === 0 ? (
          <p className="text-sm text-text-muted">{t("variationsEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {variations.map((v) => {
              const statusKey =
                v.status === "HIDDEN"
                  ? "hidden"
                  : v.status === "PENDING_REVIEW"
                    ? "pendingReview"
                    : v.status === "REJECTED"
                      ? "rejected"
                      : v.status === "DRAFT"
                        ? "draft"
                        : null;
              const statusChip = statusKey
                ? {
                    label: t(`status.${statusKey}`),
                    classes:
                      statusKey === "hidden" || statusKey === "rejected"
                        ? "bg-error/15 text-error"
                        : statusKey === "pendingReview"
                          ? "bg-secondary/20 text-secondary"
                          : "bg-bg-elevated text-text-muted",
                  }
                : null;

              return (
                <Link
                  key={v.id}
                  href={`/tarif/${v.recipe.slug}`}
                  className={`block rounded-lg border p-4 transition-colors hover:bg-bg-elevated ${
                    statusChip
                      ? "border-border/60 bg-bg-card/60"
                      : "border-border bg-bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate font-medium ${
                            statusChip ? "text-text-muted" : "text-text"
                          }`}
                        >
                          {v.miniTitle}
                        </p>
                        {statusChip && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusChip.classes}`}
                          >
                            {statusChip.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted">
                        {v.recipe.emoji} {v.recipe.title}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm text-text-muted">
                        {t("likesShort", { count: v.likeCount })}
                      </span>
                      {isOwner && (
                        <DeleteOwnVariationButton
                          variationId={v.id}
                          miniTitle={v.miniTitle}
                          variant="compact"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Reviews */}
      {(reviews.length > 0 || isOwner) && (
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-xl font-bold text-text">
            {isOwner ? t("reviewsTitleOwner") : t("reviewsTitle")}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-text-muted">
              {isOwner ? t("reviewsEmptyOwner") : t("reviewsEmptyPublic")}
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => {
                const statusKey =
                  r.status === "HIDDEN"
                    ? "hidden"
                    : r.status === "PENDING_REVIEW"
                      ? "pendingReview"
                      : null;
                const statusChip = statusKey
                  ? {
                      label: t(`status.${statusKey}`),
                      classes:
                        statusKey === "hidden"
                          ? "bg-error/15 text-error"
                          : "bg-secondary/20 text-secondary",
                    }
                  : null;

                return (
                  <li
                    key={r.id}
                    className={`rounded-lg border p-4 ${
                      statusChip
                        ? "border-border/60 bg-bg-card/60"
                        : "border-border bg-bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/tarif/${r.recipe.slug}`}
                            className={`truncate font-medium hover:text-primary ${
                              statusChip ? "text-text-muted" : "text-text"
                            }`}
                          >
                            {r.recipe.emoji} {r.recipe.title}
                          </Link>
                          {statusChip && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusChip.classes}`}
                            >
                              {statusChip.label}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className="text-sm text-[#f5a623]"
                            aria-label={t("reviewStarsAria", { n: r.rating })}
                          >
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatRelativeDate(r.createdAt, tDate)}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="mt-2 text-sm text-text">{r.comment}</p>
                        )}
                        {isOwner && r.status === "HIDDEN" && r.hiddenReason && (
                          <p className="mt-2 text-xs italic text-text-muted">
                            {t("hiddenReason", { reason: r.hiddenReason })}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Bookmarks (only visible to owner) */}
      {isOwner && (
        <section>
          <h2 className="mb-4 font-heading text-xl font-bold text-text">{t("bookmarksTitle")}</h2>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t("bookmarksEmpty")}{" "}
              <Link href="/tarifler" className="text-primary hover:text-primary-hover">
                {t("bookmarksEmptyLink")}
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bookmarks.map((b) => (
                <Link
                  key={b.id}
                  href={`/tarif/${b.recipe.slug}`}
                  className="rounded-lg border border-border bg-bg-card p-4 transition-colors hover:bg-bg-elevated"
                >
                  <p className="font-medium text-text">
                    {b.recipe.emoji} {b.recipe.title}
                  </p>
                  <p className="text-sm text-text-muted">
                    {b.recipe.category.emoji} {b.recipe.category.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
