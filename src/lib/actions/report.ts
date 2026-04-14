"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";

interface ReportResult {
  success: boolean;
  error?: string;
}

export async function createReport(formData: FormData): Promise<ReportResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
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

  // Verify the target actually exists and is reportable before creating a
  // dangling report. COMMENT type has no model yet — reject it explicitly.
  if (targetType === "COMMENT") {
    return { success: false, error: "Yorum raporlama henüz aktif değil." };
  }

  const target = await prisma.variation.findUnique({
    where: { id: targetId },
    select: { id: true, status: true },
  });
  if (!target) {
    return { success: false, error: "Raporlanan içerik bulunamadı." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Create the report and bump the variation counter atomically. The
      // @@unique([reporterId, targetType, targetId]) constraint (schema-level)
      // guarantees a user can't spam the same target.
      await tx.report.create({
        data: {
          reporterId: session.user!.id!,
          targetType,
          targetId,
          reason,
          description: description ?? null,
        },
      });

      await tx.variation.update({
        where: { id: targetId },
        data: { reportCount: { increment: 1 } },
      });
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
