"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addRecipeToCollection,
  createCollection,
  deleteCollection,
  removeRecipeFromCollection,
  updateCollection,
} from "@/lib/queries/collection";
import { collectionSchema } from "@/lib/validators";
import { maybeAwardCollectorBadge } from "@/lib/badges/service";

function requireSession() {
  return auth().then((session) => {
    if (!session?.user?.id) {
      throw new Error("Giriş yapmalısınız.");
    }
    return session.user.id;
  });
}

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function createCollectionAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireSession();
    const parsed = collectionSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
    }

    const collection = await createCollection({
      userId,
      name: parsed.data.name,
      description: parsed.data.description,
      emoji: parsed.data.emoji,
      isPublic: parsed.data.isPublic,
    });

    // Best-effort badge grant — never block create on a badge bug.
    maybeAwardCollectorBadge(userId).catch((err) => {
      console.error("[collection] badge grant failed:", err);
    });

    revalidatePath(`/profil`);
    return { success: true, data: { id: collection.id } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function updateCollectionAction(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    const parsed = collectionSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
    }

    await updateCollection(id, userId, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      emoji: parsed.data.emoji ?? null,
      isPublic: parsed.data.isPublic,
    });

    revalidatePath(`/koleksiyon/${id}`);
    revalidatePath(`/profil`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function deleteCollectionAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireSession();
    await deleteCollection(id, userId);
    revalidatePath(`/profil`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function toggleRecipeInCollectionAction(
  collectionId: string,
  recipeId: string,
  shouldAdd: boolean,
): Promise<ActionResult<{ added: boolean }>> {
  try {
    const userId = await requireSession();

    if (shouldAdd) {
      await addRecipeToCollection(collectionId, userId, recipeId);
    } else {
      await removeRecipeFromCollection(collectionId, userId, recipeId);
    }

    revalidatePath(`/koleksiyon/${collectionId}`);
    return { success: true, data: { added: shouldAdd } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}
