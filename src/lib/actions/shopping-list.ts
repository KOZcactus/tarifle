"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addCustomItem,
  addItemsFromRecipe,
  clearAllItems,
  clearCheckedItems,
  removeItem,
  toggleItemChecked,
} from "@/lib/queries/shopping-list";
import { shoppingListItemSchema } from "@/lib/validators";

async function requireSession(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Giriş yapmalısınız.");
  }
  return session.user.id;
}

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function addRecipeIngredientsAction(
  recipeId: string,
): Promise<ActionResult<{ added: number; merged: number }>> {
  try {
    const userId = await requireSession();
    const result = await addItemsFromRecipe(userId, recipeId);
    revalidatePath("/alisveris-listesi");
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function addCustomItemAction(raw: unknown): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    const parsed = shoppingListItemSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
    }

    await addCustomItem(userId, parsed.data);
    revalidatePath("/alisveris-listesi");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function toggleItemAction(
  itemId: string,
): Promise<ActionResult<{ isChecked: boolean }>> {
  try {
    const userId = await requireSession();
    const isChecked = await toggleItemChecked(userId, itemId);
    revalidatePath("/alisveris-listesi");
    return { success: true, data: { isChecked } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function removeItemAction(itemId: string): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    await removeItem(userId, itemId);
    revalidatePath("/alisveris-listesi");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function clearCheckedItemsAction(): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    await clearCheckedItems(userId);
    revalidatePath("/alisveris-listesi");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function clearAllItemsAction(): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    await clearAllItems(userId);
    revalidatePath("/alisveris-listesi");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}
