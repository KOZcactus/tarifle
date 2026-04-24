"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_SETTING_KEYS, setSiteSetting } from "@/lib/site-settings";

interface FeatureActionResult {
  success: boolean;
  error?: string;
}

/**
 * Admin-only: Leaderboard (Liderlik) özelliğini aç/kapat. Kapalıyken
 * /leaderboard sayfası 404 verir, Navbar link gizlidir. Cron yine
 * çalışır (skor birikmesi kesilmez), flag açıldığında anında hazır.
 */
export async function toggleLeaderboardFeatureAction(
  value: boolean,
): Promise<FeatureActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (userRow?.role !== "ADMIN" && userRow?.role !== "MODERATOR") {
    return { success: false, error: "forbidden" };
  }

  await setSiteSetting(
    SITE_SETTING_KEYS.LEADERBOARD_ENABLED,
    value ? "true" : "false",
    session.user.id,
  );

  // Admin feedback + Navbar/link re-render
  revalidatePath("/admin/ayarlar");
  revalidatePath("/");
  revalidatePath("/leaderboard");

  return { success: true };
}
