"use server";

import { auth } from "@/lib/auth";
import { toggleBookmark } from "@/lib/queries/user";
import { revalidatePath } from "next/cache";

export async function toggleBookmarkAction(recipeId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const isNowBookmarked = await toggleBookmark(session.user.id, recipeId);
  revalidatePath("/");
  return { success: true, bookmarked: isNowBookmarked };
}
