"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface VariationResult {
  success: boolean;
  error?: string;
}

export async function createVariation(formData: FormData): Promise<VariationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const recipeId = formData.get("recipeId") as string;
  const recipeSlug = formData.get("recipeSlug") as string;
  const miniTitle = (formData.get("miniTitle") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const ingredientsRaw = formData.get("ingredients") as string;
  const stepsRaw = formData.get("steps") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!recipeId || !miniTitle) {
    return { success: false, error: "Başlık zorunludur." };
  }

  if (miniTitle.length > 200) {
    return { success: false, error: "Başlık en fazla 200 karakter olabilir." };
  }

  let ingredients: string[] = [];
  let steps: string[] = [];

  try {
    ingredients = ingredientsRaw
      ? ingredientsRaw.split("\n").map((l) => l.trim()).filter(Boolean)
      : [];
    steps = stepsRaw
      ? stepsRaw.split("\n").map((l) => l.trim()).filter(Boolean)
      : [];
  } catch {
    return { success: false, error: "Malzeme veya adım formatı hatalı." };
  }

  if (ingredients.length === 0) {
    return { success: false, error: "En az bir malzeme ekleyin." };
  }

  if (steps.length === 0) {
    return { success: false, error: "En az bir adım ekleyin." };
  }

  await prisma.variation.create({
    data: {
      recipeId,
      authorId: session.user.id,
      miniTitle,
      description,
      ingredients: ingredients,
      steps: steps,
      notes,
    },
  });

  revalidatePath(`/tarif/${recipeSlug}`);
  return { success: true };
}
