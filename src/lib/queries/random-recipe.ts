import { prisma } from "@/lib/prisma";

/**
 * Returns a single random published recipe for "surprise me" features.
 * Uses count + skip(random offset), simple and efficient.
 */
export async function getRandomRecipe(): Promise<{
  slug: string;
  title: string;
  emoji: string | null;
} | null> {
  const count = await prisma.recipe.count({ where: { status: "PUBLISHED" } });
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  const recipe = await prisma.recipe.findFirst({
    where: { status: "PUBLISHED" },
    select: { slug: true, title: true, emoji: true },
    skip,
  });
  return recipe;
}
