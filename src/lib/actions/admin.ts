"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  notifyReportResolved,
  notifyReviewApproved,
  notifyReviewHidden,
  notifyVariationApproved,
  notifyVariationHidden,
} from "@/lib/notifications/service";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Giriş yapmalısınız.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("Yetkiniz yok.");
  }

  return session.user.id;
}

/** Raporu incele (REVIEWED veya DISMISSED) */
export async function reviewReport(reportId: string, action: "REVIEWED" | "DISMISSED") {
  const moderatorId = await requireAdmin();

  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action,
      reviewedBy: moderatorId,
      reviewedAt: new Date(),
    },
    select: { reporterId: true, targetType: true, targetId: true },
  });

  // Best-effort notify the original reporter. Fire-and-forget — we already
  // committed the moderator decision and don't want a notifications glitch
  // to bounce the whole action.
  (async () => {
    let targetTitle: string | null = null;
    if (report.targetType === "VARIATION") {
      const v = await prisma.variation.findUnique({
        where: { id: report.targetId },
        select: { miniTitle: true },
      });
      targetTitle = v?.miniTitle ?? null;
    } else if (report.targetType === "REVIEW") {
      // For reviews, "title" is the underlying recipe title — the review
      // itself has no name. Keeps the reporter notification human-readable.
      const r = await prisma.review.findUnique({
        where: { id: report.targetId },
        select: { recipe: { select: { title: true } } },
      });
      targetTitle = r?.recipe.title ?? null;
    }
    await notifyReportResolved({
      reporterId: report.reporterId,
      outcome: action === "REVIEWED" ? "upheld" : "dismissed",
      targetTitle,
    });
  })().catch((err) => console.error("[admin] report notify failed:", err));

  revalidatePath("/admin");
  return { success: true };
}

/** Uyarlamayı gizle */
export async function hideVariation(variationId: string, reason?: string) {
  const moderatorId = await requireAdmin();

  const [updated] = await prisma.$transaction([
    prisma.variation.update({
      where: { id: variationId },
      data: { status: "HIDDEN" },
      select: {
        authorId: true,
        miniTitle: true,
        recipe: { select: { slug: true } },
      },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "variation",
        targetId: variationId,
        action: "HIDE",
        reason: reason || null,
      },
    }),
  ]);

  // Notify the author their variation was hidden. Fire-and-forget.
  notifyVariationHidden({
    authorId: updated.authorId,
    recipeSlug: updated.recipe.slug,
    variationTitle: updated.miniTitle,
    reason: reason ?? null,
  }).catch((err) => console.error("[admin] hide notify failed:", err));

  revalidatePath("/admin");
  return { success: true };
}

/** Uyarlamayı onayla (yayınla) */
export async function approveVariation(variationId: string) {
  const moderatorId = await requireAdmin();

  const [updated] = await prisma.$transaction([
    prisma.variation.update({
      where: { id: variationId },
      data: { status: "PUBLISHED", reportCount: 0 },
      select: {
        authorId: true,
        miniTitle: true,
        recipe: { select: { slug: true } },
      },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "variation",
        targetId: variationId,
        action: "APPROVE",
      },
    }),
    // İlgili bekleyen raporları da kapatalım
    prisma.report.updateMany({
      where: {
        targetType: "VARIATION",
        targetId: variationId,
        status: "PENDING",
      },
      data: {
        status: "REVIEWED",
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      },
    }),
  ]);

  // Notify the author their variation is live. Fire-and-forget.
  notifyVariationApproved({
    authorId: updated.authorId,
    recipeSlug: updated.recipe.slug,
    variationTitle: updated.miniTitle,
  }).catch((err) => console.error("[admin] approve notify failed:", err));

  revalidatePath("/admin");
  return { success: true };
}

/** Yorumu gizle (moderation action + notify author) */
export async function hideReview(reviewId: string, reason?: string) {
  const moderatorId = await requireAdmin();
  const trimmedReason = reason?.trim() || null;

  const [updated] = await prisma.$transaction([
    prisma.review.update({
      where: { id: reviewId },
      data: {
        status: "HIDDEN",
        hiddenReason: trimmedReason,
      },
      select: {
        userId: true,
        recipe: { select: { slug: true, title: true } },
      },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "review",
        targetId: reviewId,
        action: "HIDE",
        reason: trimmedReason,
      },
    }),
    // Auto-resolve any pending reports pointing at this review — admin's
    // hide decision closes them.
    prisma.report.updateMany({
      where: {
        targetType: "REVIEW",
        targetId: reviewId,
        status: "PENDING",
      },
      data: {
        status: "REVIEWED",
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      },
    }),
  ]);

  notifyReviewHidden({
    authorId: updated.userId,
    recipeSlug: updated.recipe.slug,
    recipeTitle: updated.recipe.title,
    reason: trimmedReason,
  }).catch((err) => console.error("[admin] review hide notify failed:", err));

  revalidatePath("/admin");
  revalidatePath(`/tarif/${updated.recipe.slug}`);
  return { success: true };
}

/** Yorumu onayla (preflight-pending veya hidden'dan geri yayınla) */
export async function approveReview(reviewId: string) {
  const moderatorId = await requireAdmin();

  const [updated] = await prisma.$transaction([
    prisma.review.update({
      where: { id: reviewId },
      data: {
        status: "PUBLISHED",
        // Clear flags + any past hide reason — the review is clean now.
        moderationFlags: null,
        hiddenReason: null,
      },
      select: {
        userId: true,
        recipe: { select: { slug: true, title: true } },
      },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "review",
        targetId: reviewId,
        action: "APPROVE",
      },
    }),
    prisma.report.updateMany({
      where: {
        targetType: "REVIEW",
        targetId: reviewId,
        status: "PENDING",
      },
      data: {
        status: "DISMISSED",
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      },
    }),
  ]);

  notifyReviewApproved({
    authorId: updated.userId,
    recipeSlug: updated.recipe.slug,
    recipeTitle: updated.recipe.title,
  }).catch((err) => console.error("[admin] review approve notify failed:", err));

  revalidatePath("/admin");
  revalidatePath(`/tarif/${updated.recipe.slug}`);
  return { success: true };
}
