import { prisma } from "@/lib/prisma";

/**
 * Follow/feed query helpers — V1 kapsamı.
 *
 * Not: Takipçi sayıları denormalize edilmedi (User.followerCount alanı
 * yok). Profil sayfasında sayaçları aggregate query ile çekiyoruz;
 * ölçek büyürse denormalized counter + transaction-safe toggle'a geçeriz.
 */

/** Viewer verilen kullanıcıyı takip ediyor mu? */
export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (followerId === followingId) return false;
  const row = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
    select: { id: true },
  });
  return row !== null;
}

/** Bir kullanıcının takipçi ve takip ettiği sayıları. */
export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: number;
}> {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}

/** Viewer'ın takip ettiği kullanıcıların ID listesi — feed filter için. */
export async function getFollowingUserIds(userId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}

/**
 * `/akis` feed — viewer'ın takip ettiği kullanıcıların son 30 günlük
 * PUBLISHED variation'ları. Moderation queue'daki (PENDING_REVIEW) ve
 * gizlenenler (HIDDEN) hariç. Pagination ileri iş — V1 cap 40.
 */
export interface FeedVariation {
  id: string;
  miniTitle: string;
  description: string | null;
  createdAt: Date;
  likeCount: number;
  author: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  recipe: {
    slug: string;
    title: string;
    emoji: string | null;
  };
}

export async function getFollowFeedVariations(
  viewerId: string,
  limit = 40,
): Promise<FeedVariation[]> {
  const followingIds = await getFollowingUserIds(viewerId);
  if (followingIds.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - 30);

  return prisma.variation.findMany({
    where: {
      authorId: { in: followingIds },
      status: "PUBLISHED",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      miniTitle: true,
      description: true,
      createdAt: true,
      likeCount: true,
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
        },
      },
      recipe: {
        select: { slug: true, title: true, emoji: true },
      },
    },
  });
}
