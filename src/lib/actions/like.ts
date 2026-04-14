"use server";

import { auth } from "@/lib/auth";
import { toggleLike } from "@/lib/queries/user";
import { revalidatePath } from "next/cache";

export async function toggleLikeAction(variationId: string, recipePath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const isNowLiked = await toggleLike(session.user.id, variationId);
  revalidatePath(recipePath);
  return { success: true, liked: isNowLiked };
}
