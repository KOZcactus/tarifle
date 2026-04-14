"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkMultipleTexts } from "@/lib/moderation/blacklist";
import { variationSchema } from "@/lib/validators";
import { awardFirstVariationBadge } from "@/lib/badges/service";

interface VariationResult {
  success: boolean;
  error?: string;
}

function splitLines(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function createVariation(formData: FormData): Promise<VariationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const recipeSlug = (formData.get("recipeSlug") as string | null) ?? "";

  const parsed = variationSchema.safeParse({
    recipeId: formData.get("recipeId"),
    miniTitle: (formData.get("miniTitle") as string | null)?.trim(),
    description:
      (formData.get("description") as string | null)?.trim() || undefined,
    ingredients: splitLines(formData.get("ingredients") as string | null),
    steps: splitLines(formData.get("steps") as string | null),
    notes: (formData.get("notes") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Form bilgileri geçersiz.",
    };
  }

  const { recipeId, miniTitle, description, ingredients, steps, notes } =
    parsed.data;

  // Verify recipe exists and is visible — otherwise someone could spam variations
  // against arbitrary/deleted recipe IDs.
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, status: true },
  });
  if (!recipe || recipe.status === "REJECTED" || recipe.status === "HIDDEN") {
    return { success: false, error: "Tarif bulunamadı." };
  }

  // Argo/küfür kontrolü
  const textsToCheck = [
    miniTitle,
    description ?? "",
    notes ?? "",
    ...ingredients,
    ...steps,
  ];
  const blacklistResult = checkMultipleTexts(textsToCheck);
  if (!blacklistResult.isClean) {
    return {
      success: false,
      error:
        "İçeriğiniz uygunsuz ifadeler içeriyor. Lütfen düzenleyip tekrar deneyin.",
    };
  }

  await prisma.variation.create({
    data: {
      recipeId,
      authorId: session.user.id,
      miniTitle,
      description: description ?? null,
      ingredients,
      steps,
      notes: notes ?? null,
    },
  });

  // Best-effort badge grant — never block the publish path.
  awardFirstVariationBadge(session.user.id).catch((err) => {
    console.error("[variation] badge grant failed:", err);
  });

  revalidatePath(`/tarif/${recipeSlug}`);
  return { success: true };
}
