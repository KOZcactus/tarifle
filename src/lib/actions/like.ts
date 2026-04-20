"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleLike } from "@/lib/queries/user";
import { revalidatePath } from "next/cache";
import { maybeAwardPopularBadge } from "@/lib/badges/service";
import { notifyVariationLiked } from "@/lib/notifications/service";

export async function toggleLikeAction(variationId: string, recipePath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const isNowLiked = await toggleLike(session.user.id, variationId);

  if (isNowLiked) {
    // Like only counts toward the author's POPULAR badge, best-effort.
    maybeAwardPopularBadge(variationId).catch((err) => {
      console.error("[like] badge grant failed:", err);
    });

    // Fire-and-forget notification to the variation author. We look the
    // row up here instead of passing it in because the caller has only
    // the variation id; the extra query is negligible compared to the
    // like write itself. Self-likes skip, nobody wants "you liked your
    // own thing" in their bell.
    (async () => {
      const variation = await prisma.variation.findUnique({
        where: { id: variationId },
        select: {
          authorId: true,
          miniTitle: true,
          recipe: { select: { slug: true } },
        },
      });
      if (!variation || variation.authorId === session.user!.id) return;
      const liker = await prisma.user.findUnique({
        where: { id: session.user!.id },
        select: { name: true },
      });
      await notifyVariationLiked({
        authorId: variation.authorId,
        likerName: liker?.name ?? null,
        recipeSlug: variation.recipe.slug,
        variationTitle: variation.miniTitle,
      });
    })().catch((err) => console.error("[like] notification failed:", err));
  }

  revalidatePath(recipePath);
  return { success: true, liked: isNowLiked };
}
