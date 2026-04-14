import { prisma } from "@/lib/prisma";

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          variations: true,
          bookmarks: true,
        },
      },
    },
  });
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

export async function getUserVariations(userId: string) {
  return prisma.variation.findMany({
    where: { authorId: userId },
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
