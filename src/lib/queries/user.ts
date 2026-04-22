import { prisma } from "@/lib/prisma";

export async function getUserByUsername(username: string, viewerId?: string | null) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
      isVerified: true,
      // Sensitive, only return to owner; we filter below before yielding
      email: true,
      emailVerified: true,
      // Profil gizlilik tercihleri (oturum 13). Profil sayfası ve leaderboard
      // bu üç bayrağı kullanarak conditional render yapar; owner kendisi her
      // zaman görür, başkalarına bayrak değerine bağlı.
      showChefScore: true,
      showActivity: true,
      showFollowCounts: true,
      createdAt: true,
      _count: {
        select: {
          // Public counter: only PUBLISHED variations leak via this number
          variations: { where: { status: "PUBLISHED" } },
          bookmarks: true,
        },
      },
    },
  });

  if (!user) return null;

  // Owner sees their full count including hidden/pending/rejected
  if (viewerId && viewerId === user.id) {
    const totalVariations = await prisma.variation.count({
      where: { authorId: user.id },
    });
    return {
      ...user,
      _count: { ...user._count, variations: totalVariations },
    };
  }

  // Strip private fields for non-owner viewers, never let email leak via
  // the public profile endpoint.
  const { email: _email, emailVerified: _emailVerified, ...publicUser } = user;
  return publicUser;
}

/**
 * Public profile stat vitrin için aggregated sayılar + son aktivite.
 * `getUserByUsername` zaten temel counter'ları döner; bu helper o
 * counter'ların üstüne (a) toplam aldığı beğeni (variations.likeCount
 * SUM), (b) review sayısı, (c) public collection sayısı, (d) son 10
 * aktiviteyi ekler. Tek yere topluyorum ki profil page Promise.all'ında
 * tek eklenti olsun, mevcut 5 query'ye ek 1.
 *
 * Public-safe: tüm sinyaller PUBLISHED + public visibility filter'ından
 * geçer. Viewer non-owner ise bile aynı rakamlar, bunlar zaten
 * herkese açık agregasyon.
 */
export interface ProfileActivityItem {
  kind: "variation" | "review" | "collection";
  id: string;
  at: Date;
  title: string;
  /** Deep link, variation ve review tarif detayına, collection kendi
   *  sayfasına gider. */
  href: string;
  /** Görsel ipucu için emoji (tarif emojisi veya kategori). */
  emoji?: string | null;
}

export interface ProfileStats {
  publishedVariations: number;
  publishedReviews: number;
  publicCollections: number;
  totalLikesReceived: number;
  recentActivity: ProfileActivityItem[];
}

export async function getUserProfileStats(
  userId: string,
): Promise<ProfileStats> {
  const [variationAgg, reviewCount, collectionCount, recentVariations, recentReviews, recentCollections] =
    await Promise.all([
      prisma.variation.aggregate({
        where: { authorId: userId, status: "PUBLISHED" },
        _count: { _all: true },
        _sum: { likeCount: true },
      }),
      prisma.review.count({
        where: { userId, status: "PUBLISHED" },
      }),
      prisma.collection.count({
        where: { userId, isPublic: true },
      }),
      prisma.variation.findMany({
        where: { authorId: userId, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          miniTitle: true,
          createdAt: true,
          recipe: { select: { slug: true, emoji: true, title: true } },
        },
      }),
      prisma.review.findMany({
        where: { userId, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          rating: true,
          recipe: { select: { slug: true, emoji: true, title: true } },
        },
      }),
      prisma.collection.findMany({
        where: { userId, isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          emoji: true,
          createdAt: true,
        },
      }),
    ]);

  const recentActivity: ProfileActivityItem[] = [
    ...recentVariations.map((v): ProfileActivityItem => ({
      kind: "variation",
      id: v.id,
      at: v.createdAt,
      title: v.miniTitle,
      href: `/tarif/${v.recipe.slug}`,
      emoji: v.recipe.emoji,
    })),
    ...recentReviews.map((r): ProfileActivityItem => ({
      kind: "review",
      id: r.id,
      at: r.createdAt,
      title: r.recipe.title,
      href: `/tarif/${r.recipe.slug}`,
      emoji: r.recipe.emoji,
    })),
    ...recentCollections.map((c): ProfileActivityItem => ({
      kind: "collection",
      id: c.id,
      at: c.createdAt,
      title: c.name,
      href: `/koleksiyon/${c.id}`,
      emoji: c.emoji,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return {
    publishedVariations: variationAgg._count._all,
    publishedReviews: reviewCount,
    publicCollections: collectionCount,
    totalLikesReceived: variationAgg._sum.likeCount ?? 0,
    recentActivity,
  };
}

export async function getUserBookmarks(userId: string) {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      recipe: {
        include: {
          category: { select: { name: true, slug: true, emoji: true } },
        },
      },
    },
  });
}

export async function getUserVariations(userId: string, includeHidden = false) {
  return prisma.variation.findMany({
    where: {
      authorId: userId,
      ...(includeHidden ? {} : { status: "PUBLISHED" }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      recipe: {
        select: { title: true, slug: true, emoji: true },
      },
    },
  });
}

/**
 * Profile "Yorumlarım" section. `includeHidden` controls whether HIDDEN and
 * PENDING_REVIEW rows come back, the owner sees everything so they can tell
 * why their review isn't showing publicly; non-owners only see PUBLISHED.
 */
export async function getUserReviews(userId: string, includeHidden = false) {
  return prisma.review.findMany({
    where: {
      userId,
      ...(includeHidden ? {} : { status: "PUBLISHED" }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      status: true,
      hiddenReason: true,
      createdAt: true,
      recipe: {
        select: { title: true, slug: true, emoji: true },
      },
    },
  });
}

export async function isBookmarked(userId: string, recipeId: string) {
  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });
  return !!bookmark;
}

export async function toggleBookmark(userId: string, recipeId: string) {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.bookmark.create({ data: { userId, recipeId } });
  return true;
}

export async function toggleLike(userId: string, variationId: string) {
  const existing = await prisma.like.findUnique({
    where: { userId_variationId: { userId, variationId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.variation.update({
        where: { id: variationId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    return false;
  }

  await prisma.$transaction([
    prisma.like.create({ data: { userId, variationId } }),
    prisma.variation.update({
      where: { id: variationId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);
  return true;
}

export async function isLiked(userId: string, variationId: string) {
  const like = await prisma.like.findUnique({
    where: { userId_variationId: { userId, variationId } },
  });
  return !!like;
}

/**
 * Verilen variation ID'leri için kullanıcının beğendiklerini Set olarak
 * döner. Tarif detay sayfası tek seferde N variation'ın "liked?" durumunu
 * öğrenmek için kullanır, N+1 sorgu yerine tek IN(). Boş set boş input
 * için ya da kullanıcı yoksa.
 */
export async function getLikedVariationIds(
  userId: string,
  variationIds: readonly string[],
): Promise<Set<string>> {
  if (variationIds.length === 0) return new Set();
  const likes = await prisma.like.findMany({
    where: { userId, variationId: { in: [...variationIds] } },
    select: { variationId: true },
  });
  return new Set(likes.map((l) => l.variationId));
}
