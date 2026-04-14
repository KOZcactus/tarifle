"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = ["SPAM", "PROFANITY", "MISLEADING", "HARMFUL", "OTHER"] as const;

interface ReportResult {
  success: boolean;
  error?: string;
}

export async function createReport(formData: FormData): Promise<ReportResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  const targetType = formData.get("targetType") as string;
  const targetId = formData.get("targetId") as string;
  const reason = formData.get("reason") as string;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!targetId || !targetType) {
    return { success: false, error: "Geçersiz hedef." };
  }

  if (!reason || !VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
    return { success: false, error: "Geçerli bir sebep seçin." };
  }

  // Aynı kullanıcı aynı hedefi zaten raporlamış mı?
  const existing = await prisma.report.findFirst({
    where: {
      reporterId: session.user.id,
      targetType: targetType as "VARIATION" | "COMMENT",
      targetId,
    },
  });

  if (existing) {
    return { success: false, error: "Bu içeriği zaten raporladınız." };
  }

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType: targetType as "VARIATION" | "COMMENT",
      targetId,
      reason: reason as typeof VALID_REASONS[number],
      description,
    },
  });

  // Uyarlama'nın reportCount'unu artır
  if (targetType === "VARIATION") {
    await prisma.variation.update({
      where: { id: targetId },
      data: { reportCount: { increment: 1 } },
    });
  }

  return { success: true };
}
