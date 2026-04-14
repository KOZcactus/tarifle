"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action,
      reviewedBy: moderatorId,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

/** Uyarlamayı gizle */
export async function hideVariation(variationId: string, reason?: string) {
  const moderatorId = await requireAdmin();

  await prisma.$transaction([
    prisma.variation.update({
      where: { id: variationId },
      data: { status: "HIDDEN" },
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

  revalidatePath("/admin");
  return { success: true };
}

/** Uyarlamayı onayla (yayınla) */
export async function approveVariation(variationId: string) {
  const moderatorId = await requireAdmin();

  await prisma.$transaction([
    prisma.variation.update({
      where: { id: variationId },
      data: { status: "PUBLISHED", reportCount: 0 },
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

  revalidatePath("/admin");
  return { success: true };
}
