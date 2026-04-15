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
      // Sensitive — only return to owner; we filter below before yielding
      email: true,
      emailVerified: true,
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

  // Strip private fields for non-owner viewers — never let email leak via
  // the public profile endpoint.
  const { email: _email, emailVerified: _emailVerified, ...publicUser } = user;
  return publicUser;
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
 * öğrenmek için kullanır — N+1 sorgu yerine tek IN(). Boş set boş input
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
