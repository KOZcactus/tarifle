"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkMultipleTexts } from "@/lib/moderation/blacklist";
import { variationSchema } from "@/lib/validators";
import { awardFirstVariationBadge } from "@/lib/badges/service";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";

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

  // 5 variations / hour keeps enthusiastic contributors happy (typical user
  // will post 1-2 a week) while blocking bulk spam. Badge awarding happens
  // post-insert so a rate-limited run doesn't accidentally grant a badge.
  const rate = await checkRateLimit(
    "variation-create",
    rateLimitIdentifier(session.user.id),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
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

  // Strict PUBLISHED check — DRAFT/PENDING_REVIEW/HIDDEN/REJECTED are all
  // invalid targets for community variations. Prevents users from attaching
  // content to in-review or admin-private recipes via crafted IDs.
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, status: true },
  });
  if (!recipe || recipe.status !== "PUBLISHED") {
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
