"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitIdentifier, getClientIp } from "@/lib/rate-limit";
import { checkMultipleTexts } from "@/lib/moderation/blacklist";
import { computeReviewPreflightFlags } from "@/lib/moderation/preflight-review";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
  reviewId?: string;
  /** True when preflight flagged the comment and it landed in PENDING_REVIEW. */
  pendingReview?: boolean;
}

/**
 * Create or update a user's review on a recipe. `@@unique([userId, recipeId])`
 * means there's at most one review per user per recipe — so this upserts
 * (edit if exists, create if not). Rate-limited to prevent spam.
 */
export async function submitReviewAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Geçersiz form — yıldız 1-5 arası, yorum 10-800 karakter olmalı.",
    };
  }
  const { recipeId, rating, comment } = parsed.data;

  const limited = await checkRateLimit(
    "review-submit",
    rateLimitIdentifier(session.user.id, await getClientIp()),
  );
  if (!limited.success) {
    return {
      success: false,
      error: limited.message ?? "Çok fazla yorum gönderdin — biraz sonra tekrar dene.",
    };
  }

  // Verify recipe exists and is published (block reviews on draft/hidden)
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, status: true, slug: true },
  });
  if (!recipe || recipe.status !== "PUBLISHED") {
    return { success: false, error: "Bu tarife şu an yorum yapılamıyor." };
  }

  // Hard profanity filter — matches the variation action. Only scans the
  // comment body (rating alone can't carry text). Blacklist hit is an
  // outright rejection, not a preflight flag.
  if (comment) {
    const blacklistResult = checkMultipleTexts([comment]);
    if (!blacklistResult.isClean) {
      return {
        success: false,
        error:
          "Yorumun uygunsuz ifadeler içeriyor. Lütfen düzenleyip tekrar dene.",
      };
    }
  }

  // Soft preflight — spam patterns, shouting, URLs. If any fire the review
  // lands in PENDING_REVIEW and shows up on the admin queue. Rating-only
  // submissions always return no flags.
  const preflight = computeReviewPreflightFlags({ comment: comment ?? null });
  const status = preflight.needsReview ? "PENDING_REVIEW" : "PUBLISHED";
  const moderationFlags = preflight.needsReview
    ? preflight.flags.join(",")
    : null;

  const review = await prisma.review.upsert({
    where: {
      userId_recipeId: {
        userId: session.user.id,
        recipeId: recipe.id,
      },
    },
    create: {
      userId: session.user.id,
      recipeId: recipe.id,
      rating,
      comment: comment ?? null,
      status,
      moderationFlags,
    },
    update: {
      rating,
      comment: comment ?? null,
      // On edit, recompute status from scratch. A previously hidden review
      // that's now clean can re-publish; a previously clean one that now
      // trips preflight goes back to PENDING_REVIEW. hiddenReason clears
      // on every edit — if the admin needs to re-hide they'll add fresh context.
      status,
      moderationFlags,
      hiddenReason: null,
    },
  });

  revalidatePath(`/tarif/${recipe.slug}`);
  revalidatePath("/profil/[username]", "page");
  return {
    success: true,
    reviewId: review.id,
    pendingReview: preflight.needsReview,
  };
}

/**
 * Delete the caller's own review. Ownership gate enforced at DB layer —
 * userId match is required via the compound unique index.
 */
export async function deleteOwnReviewAction(reviewId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true, recipe: { select: { slug: true } } },
  });
  if (!review) {
    return { success: false, error: "Yorum bulunamadı." };
  }
  if (review.userId !== session.user.id) {
    return { success: false, error: "Bu yorumu silme yetkin yok." };
  }

  await prisma.review.delete({ where: { id: reviewId } });

  revalidatePath(`/tarif/${review.recipe.slug}`);
  revalidatePath("/profil/[username]", "page");
  return { success: true };
}
