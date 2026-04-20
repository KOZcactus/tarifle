import { prisma } from "@/lib/prisma";

/**
 * Follow/feed query helpers, V1 kapsamı.
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

/** Viewer'ın takip ettiği kullanıcıların ID listesi, feed filter için. */
export async function getFollowingUserIds(userId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}

/**
 * `/akis` feed, viewer'ın takip ettiği kullanıcıların son 30 günlük
 * PUBLISHED variation'ları. Moderation queue'daki (PENDING_REVIEW) ve
 * gizlenenler (HIDDEN) hariç. Pagination ileri iş, V1 cap 40.
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

export interface FollowListUser {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followedAt: Date;
  variationCount: number;
}

/**
 * Bir kullanıcıyı takip edenler (followers) listesi. "Takipçiler" sayfası.
 * createdAt DESC, en son takip edenler başta.
 */
export async function getFollowersList(
  userId: string,
  limit = 100,
): Promise<FollowListUser[]> {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      createdAt: true,
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          bio: true,
          _count: { select: { variations: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.follower.id,
    username: r.follower.username,
    name: r.follower.name,
    avatarUrl: r.follower.avatarUrl,
    bio: r.follower.bio,
    followedAt: r.createdAt,
    variationCount: r.follower._count.variations,
  }));
}

/**
 * Bir kullanıcının takip ettiği kullanıcılar (following) listesi.
 * "Takip ettikleri" sayfası.
 */
export async function getFollowingList(
  userId: string,
  limit = 100,
): Promise<FollowListUser[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      createdAt: true,
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          bio: true,
          _count: { select: { variations: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.following.id,
    username: r.following.username,
    name: r.following.name,
    avatarUrl: r.following.avatarUrl,
    bio: r.following.bio,
    followedAt: r.createdAt,
    variationCount: r.following._count.variations,
  }));
}

export interface SuggestedCook {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  variationCount: number;
}

/**
 * Homepage "önerilen aşçılar" kartı için. En çok takipçisi olan + son 30
 * günde aktif (variation paylaşmış) kullanıcıları döndürür. Suspended
 * hesapları ve role=ADMIN/MODERATOR'ı (resmi hesap değil, tarif yazarı
 * önerisi istiyoruz) dışlamak için ilk pass'te basit filter kullanıyoruz
 *, ölçek büyürse dedicated materialized view'a taşırız.
 *
 * viewerId verilirse viewer'ın kendini veya zaten takip ettiklerini
 * dışlar (yeni kişiler önersin).
 */
export async function getSuggestedCooks(
  viewerId: string | null,
  limit = 6,
): Promise<SuggestedCook[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  // Son 30 günde variation yazmış + takipçisi olan kullanıcıları skor
  // sırasıyla çek. Raw SQL'e girmeden Prisma ile yaklaşık skor:
  // _count.followers DESC, _count.variations DESC. İlk 30 aday çek,
  // viewer filtresi uygula, limit cap.
  const excludeIds = new Set<string>();
  if (viewerId) {
    excludeIds.add(viewerId);
    const following = await prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    for (const f of following) excludeIds.add(f.followingId);
  }

  const candidates = await prisma.user.findMany({
    where: {
      suspendedAt: null,
      deletedAt: null,
      variations: {
        some: {
          status: "PUBLISHED",
          createdAt: { gte: since },
        },
      },
      ...(excludeIds.size > 0 ? { id: { notIn: [...excludeIds] } } : {}),
    },
    orderBy: [
      { followers: { _count: "desc" } },
      { variations: { _count: "desc" } },
    ],
    take: limit,
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      _count: {
        select: { followers: true, variations: true },
      },
    },
  });

  return candidates.map((c) => ({
    id: c.id,
    username: c.username,
    name: c.name,
    avatarUrl: c.avatarUrl,
    bio: c.bio,
    followerCount: c._count.followers,
    variationCount: c._count.variations,
  }));
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
