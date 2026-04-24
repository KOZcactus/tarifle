/**
 * Server-side helper: kullanıcı için preference profile derle.
 *   - Explicit: User.favoriteCuisines + favoriteTags
 *   - Implicit: son 20 bookmark'lı tarifin cuisine + tag frequency
 *
 * AI v3 action result ranking'inde kullanılır (preference-boost.ts).
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserPreferenceProfile } from "./preference-boost";
import { emptyProfile } from "./preference-boost";

export async function loadUserPreferenceProfile(
  userId: string,
): Promise<UserPreferenceProfile> {
  const [user, bookmarks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { favoriteCuisines: true, favoriteTags: true },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        recipe: {
          select: {
            cuisine: true,
            tags: { select: { tag: { select: { slug: true } } } },
          },
        },
      },
    }),
  ]);

  if (!user) return emptyProfile();

  const cuisineWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  for (const bookmark of bookmarks) {
    const r = bookmark.recipe;
    if (r.cuisine) {
      cuisineWeights.set(r.cuisine, (cuisineWeights.get(r.cuisine) ?? 0) + 1);
    }
    for (const tg of r.tags) {
      const slug = tg.tag.slug;
      tagWeights.set(slug, (tagWeights.get(slug) ?? 0) + 1);
    }
  }

  return {
    favoriteCuisines: new Set(user.favoriteCuisines ?? []),
    favoriteTags: new Set(user.favoriteTags ?? []),
    bookmarkedCuisineWeights: cuisineWeights,
    bookmarkedTagWeights: tagWeights,
  };
}
