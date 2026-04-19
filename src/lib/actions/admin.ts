"use server";

import { auth } from "@/lib/auth";
import { canChangeRole } from "@/lib/auth/super-admin";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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

// ─── Bulk moderation actions ──────────────────────────────

export interface BulkModerateResult {
  success: boolean;
  processed: number;
  skipped: number;
  error?: string;
}

/**
 * Çoklu uyarlama ya da yorum için toplu moderasyon — "hide" veya
 * "approve". Tek tek hide/approveVariation/Review yerine moderator
 * checkbox'lı liste + tek tık toolbar kullansın.
 *
 * Notification gönderimi her satır için fire-and-forget kalır; tek
 * hata tüm batch'i patlatmaz (Promise.allSettled).
 *
 * IDs array 50 üst sınırı — daha büyük batch'leri sayfalı işlemek
 * güvenli (accidental mass-hide'ı engellemek).
 */
const BULK_LIMIT = 50;

export async function bulkModerateAction(
  targetType: "VARIATION" | "REVIEW",
  action: "hide" | "approve",
  ids: string[],
  reason?: string,
): Promise<BulkModerateResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return {
      success: false,
      processed: 0,
      skipped: 0,
      error: err instanceof Error ? err.message : "unauthorized",
    };
  }

  const uniqueIds = [...new Set(ids)].filter((id) => typeof id === "string" && id.length > 0);
  if (uniqueIds.length === 0) {
    return { success: false, processed: 0, skipped: 0, error: "no-ids" };
  }
  if (uniqueIds.length > BULK_LIMIT) {
    return {
      success: false,
      processed: 0,
      skipped: uniqueIds.length - BULK_LIMIT,
      error: "too-many",
    };
  }

  const handler =
    targetType === "VARIATION"
      ? action === "hide"
        ? (id: string) => hideVariation(id, reason).then(() => true).catch(() => false)
        : (id: string) => approveVariation(id).then(() => true).catch(() => false)
      : action === "hide"
        ? (id: string) => hideReview(id, reason).then(() => true).catch(() => false)
        : (id: string) => approveReview(id).then(() => true).catch(() => false);

  const results = await Promise.all(uniqueIds.map(handler));
  const processed = results.filter(Boolean).length;
  const skipped = results.length - processed;

  revalidatePath("/admin/incelemeler");
  revalidatePath("/admin/yorumlar");

  return { success: true, processed, skipped };
}

// ─── Inline edit actions ──────────────────────────────────

const updateRecipeSchema = z.object({
  recipeId: z.string().min(1),
  patch: z
    .object({
      title: z.string().min(2).max(200).optional(),
      emoji: z.string().max(8).optional(),
      description: z.string().min(10).max(1000).optional(),
      isFeatured: z.boolean().optional(),
      status: z
        .enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "HIDDEN", "REJECTED"])
        .optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "En az bir alan güncellenmelidir.",
    }),
});

/**
 * Admin patch endpoint for Recipe. Only whitelisted fields. ModerationAction
 * audit kaydı her update için — hangi alan değişti yazılır, hangi admin.
 * status=HIDDEN geçişinde tarif public'ten çıkar; revalidatePath tarif
 * sayfasını ve listeleri tazeler.
 */
export async function updateRecipeAction(
  input: unknown,
): Promise<{ success: boolean; error?: string }> {
  const moderatorId = await requireAdmin();

  const parsed = updateRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz form.",
    };
  }
  const { recipeId, patch } = parsed.data;

  const current = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      slug: true,
      title: true,
      emoji: true,
      description: true,
      isFeatured: true,
      status: true,
    },
  });
  if (!current) return { success: false, error: "Tarif bulunamadı." };

  // Diff summary for audit log — "title: 'old' → 'new'" pattern.
  const changes: string[] = [];
  for (const [k, v] of Object.entries(patch)) {
    const before = (current as Record<string, unknown>)[k];
    if (before !== v) {
      changes.push(`${k}: ${JSON.stringify(before)} → ${JSON.stringify(v)}`);
    }
  }
  if (changes.length === 0) return { success: true };

  await prisma.$transaction([
    prisma.recipe.update({
      where: { id: recipeId },
      data: patch,
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "recipe",
        targetId: recipeId,
        action: "EDIT",
        reason: changes.join("; ").slice(0, 500),
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath(`/admin/tarifler/${current.slug}`);
  revalidatePath(`/tarif/${current.slug}`);
  return { success: true };
}

const updateUserSchema = z.object({
  userId: z.string().min(1),
  patch: z
    .object({
      role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
      isVerified: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "En az bir alan güncellenmelidir.",
    }),
});

/**
 * Admin patch endpoint for User. Rol değişimi ADMIN yetkisi ister (requireAdmin
 * MODERATOR'u da kabul ediyor — inline ikinci guard). Self-demotion yasak.
 */
export async function updateUserAction(
  input: unknown,
): Promise<{ success: boolean; error?: string }> {
  const moderatorId = await requireAdmin();
  const moderator = await prisma.user.findUnique({
    where: { id: moderatorId },
    select: { role: true },
  });

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz form.",
    };
  }
  const { userId, patch } = parsed.data;

  if (patch.role && moderator?.role !== "ADMIN") {
    return { success: false, error: "Rol değişikliği için ADMIN yetkisi gerekli." };
  }
  if (patch.role && userId === moderatorId && patch.role !== "ADMIN") {
    return { success: false, error: "Kendi ADMIN rolünü düşüremezsin." };
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, role: true, isVerified: true },
  });
  if (!current) return { success: false, error: "Kullanıcı bulunamadı." };

  // Super-admin protection: kozcactus gibi süper admin username'lerine
  // başka bir admin rol değişimi uygulayamaz. Kural `super-admin.ts`'de
  // tek yerde (hem UI hem server action aynı predicate'ı paylaşıyor).
  if (patch.role) {
    const actor = await prisma.user.findUnique({
      where: { id: moderatorId },
      select: { username: true },
    });
    if (!canChangeRole(actor?.username, current.username)) {
      return {
        success: false,
        error: "Bu kullanıcının rolünü değiştirme yetkin yok.",
      };
    }
  }

  const changes: string[] = [];
  for (const [k, v] of Object.entries(patch)) {
    const before = (current as Record<string, unknown>)[k];
    if (before !== v) {
      changes.push(`${k}: ${JSON.stringify(before)} → ${JSON.stringify(v)}`);
    }
  }
  if (changes.length === 0) return { success: true };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: patch }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "user",
        targetId: userId,
        action: "EDIT",
        reason: changes.join("; ").slice(0, 500),
      },
    }),
  ]);

  revalidatePath("/admin");
  if (current.username) {
    revalidatePath(`/admin/kullanicilar/${current.username}`);
    revalidatePath(`/profil/${current.username}`);
  }
  return { success: true };
}

