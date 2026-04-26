"use server";

import { auth } from "@/lib/auth";
import {
  toggleRecipeCooked,
  getCookedCount,
} from "@/lib/queries/recipe-cooked";
import { revalidatePath } from "next/cache";

export async function toggleRecipeCookedAction(input: {
  recipeId: string;
  slug: string;
  servings?: number;
}): Promise<
  | { success: true; isCooked: boolean; count: number }
  | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }
  const { isCooked } = await toggleRecipeCooked(
    session.user.id,
    input.recipeId,
    input.servings,
  );
  const count = await getCookedCount(input.recipeId);
  revalidatePath(`/tarif/${input.slug}`);
  return { success: true, isCooked, count };
}
