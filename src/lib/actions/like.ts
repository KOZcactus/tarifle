"use server";

import { auth } from "@/lib/auth";
import { toggleLike } from "@/lib/queries/user";
import { revalidatePath } from "next/cache";
import { maybeAwardPopularBadge } from "@/lib/badges/service";

export async function toggleLikeAction(variationId: string, recipePath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const isNowLiked = await toggleLike(session.user.id, variationId);

  if (isNowLiked) {
    // Like only counts toward the author's POPULAR badge — best-effort.
    maybeAwardPopularBadge(variationId).catch((err) => {
      console.error("[like] badge grant failed:", err);
    });
  }

  revalidatePath(recipePath);
  return { success: true, liked: isNowLiked };
}
