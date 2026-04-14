import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function getUserCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { items: true } },
      items: {
        take: 4,
        orderBy: { addedAt: "desc" },
        include: {
          recipe: {
            select: { id: true, title: true, slug: true, emoji: true, imageUrl: true },
          },
        },
      },
    },
  });
}

export async function getPublicCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId, isPublic: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { items: true } },
      items: {
        take: 4,
        orderBy: { addedAt: "desc" },
        include: {
          recipe: {
            select: { id: true, title: true, slug: true, emoji: true, imageUrl: true },
          },
        },
      },
    },
  });
}

export async function getCollectionById(id: string) {
  return prisma.collection.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, name: true, avatarUrl: true } },
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          recipe: {
            include: {
              category: { select: { name: true, slug: true, emoji: true } },
              _count: { select: { variations: true } },
            },
          },
        },
      },
    },
  });
}

export async function getCollectionsForRecipe(userId: string, recipeId: string) {
  // Returns user's collections with a flag indicating if the recipe is in each
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { items: true } },
      items: {
        where: { recipeId },
        select: { id: true },
      },
    },
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    count: c._count.items,
    hasRecipe: c.items.length > 0,
  }));
}

export async function createCollection(data: {
  userId: string;
  name: string;
  description?: string;
  emoji?: string;
  isPublic?: boolean;
}) {
  const baseSlug = slugify(data.name) || "koleksiyon";
  let slug = baseSlug;
  let suffix = 1;

  // Ensure unique slug per user
  while (
    await prisma.collection.findUnique({
      where: { userId_slug: { userId: data.userId, slug } },
    })
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return prisma.collection.create({
    data: {
      userId: data.userId,
      name: data.name,
      slug,
      description: data.description,
      emoji: data.emoji,
      isPublic: data.isPublic ?? false,
    },
  });
}

export async function updateCollection(
  id: string,
  userId: string,
  data: {
    name?: string;
    description?: string | null;
    emoji?: string | null;
    isPublic?: boolean;
  },
) {
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Koleksiyon bulunamadı.");
  }

  return prisma.collection.update({
    where: { id },
    data,
  });
}

export async function deleteCollection(id: string, userId: string) {
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Koleksiyon bulunamadı.");
  }

  return prisma.collection.delete({ where: { id } });
}

export async function addRecipeToCollection(
  collectionId: string,
  userId: string,
  recipeId: string,
) {
  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.userId !== userId) {
    throw new Error("Koleksiyon bulunamadı.");
  }

  return prisma.collectionItem.upsert({
    where: { collectionId_recipeId: { collectionId, recipeId } },
    create: { collectionId, recipeId },
    update: {},
  });
}

export async function removeRecipeFromCollection(
  collectionId: string,
  userId: string,
  recipeId: string,
) {
  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.userId !== userId) {
    throw new Error("Koleksiyon bulunamadı.");
  }

  return prisma.collectionItem.deleteMany({
    where: { collectionId, recipeId },
  });
}
