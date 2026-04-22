"use server";

/**
 * User privacy preferences. /ayarlar Gizlilik bolumu kullanir.
 *
 * Uc bagimsiz toggle:
 *   - showChefScore     → profil chip + leaderboard'da gozukur
 *   - showActivity      → "Son aktiviteler" timeline gozukur
 *   - showFollowCounts  → takipci/takip sayilari + listeler gozukur
 *
 * Default hepsi true (mevcut davranisla geriye uyumlu, opt-out).
 * Owner kendi profilinde bu ayarlardan bagimsiz her seyi gorur,
 * isOwner kontrolu render seviyesinde yapilir.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const privacySchema = z.object({
  showChefScore: z.boolean(),
  showActivity: z.boolean(),
  showFollowCounts: z.boolean(),
});

export type PrivacyInput = z.infer<typeof privacySchema>;

export interface PrivacyActionResult {
  success: boolean;
  error?: string;
}

export async function updateUserPrivacyAction(
  input: PrivacyInput,
): Promise<PrivacyActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = privacySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "invalid input",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      showChefScore: parsed.data.showChefScore,
      showActivity: parsed.data.showActivity,
      showFollowCounts: parsed.data.showFollowCounts,
    },
  });

  revalidatePath("/ayarlar");
  // Profil sayfasi tekrar render edilsin, takipciler/leaderboard cache
  // tag'i ile invalidate edilebilir; bu MVP turunda revalidate yeterli.
  revalidatePath(`/profil/${session.user.username ?? ""}`);
  return { success: true };
}

export async function getUserPrivacy(userId: string): Promise<{
  showChefScore: boolean;
  showActivity: boolean;
  showFollowCounts: boolean;
}> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      showChefScore: true,
      showActivity: true,
      showFollowCounts: true,
    },
  });
  if (!row) {
    return { showChefScore: true, showActivity: true, showFollowCounts: true };
  }
  return row;
}
