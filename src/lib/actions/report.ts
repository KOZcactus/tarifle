"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";

interface ReportResult {
  success: boolean;
  error?: string;
}

export async function createReport(formData: FormData): Promise<ReportResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  // 10 reports / hour is generous for an honest user flagging a thread of
  // problem content; it cuts off mass-flagging campaigns hard. DB-level
  // @@unique([reporterId, targetType, targetId]) still prevents duplicate
  // reports on the same target — rate limit protects breadth, unique protects
  // depth.
  const rate = await checkRateLimit("report", rateLimitIdentifier(session.user.id));
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    description:
      (formData.get("description") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz rapor.",
    };
  }

  const { targetType, targetId, reason, description } = parsed.data;

  // Verify the target actually exists before creating a dangling report.
  // VARIATION and REVIEW branches diverge on two things: the model we look
  // the row up in, and whether we bump a denormalised `reportCount`. Variation
  // has one (drives the "most reported" admin view); Review doesn't — the
  // admin review list joins through Report directly via `getReportedReviews`.
  if (targetType === "VARIATION") {
    const target = await prisma.variation.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      return { success: false, error: "Raporlanan içerik bulunamadı." };
    }
  } else if (targetType === "REVIEW") {
    const target = await prisma.review.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      return { success: false, error: "Raporlanan içerik bulunamadı." };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Create the report. The @@unique([reporterId, targetType, targetId])
      // constraint prevents a user from flagging the same target twice.
      await tx.report.create({
        data: {
          reporterId: session.user!.id!,
          targetType,
          targetId,
          reason,
          description: description ?? null,
        },
      });

      if (targetType === "VARIATION") {
        await tx.variation.update({
          where: { id: targetId },
          data: { reportCount: { increment: 1 } },
        });
      }
    });
  } catch (error: unknown) {
    // Unique-constraint violation → user already reported this target
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { success: false, error: "Bu içeriği zaten raporladınız." };
    }
    throw error;
  }

  return { success: true };
}
