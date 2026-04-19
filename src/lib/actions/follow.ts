"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFollowed } from "@/lib/notifications/service";

export interface FollowActionResult {
  success: boolean;
  error?: string;
  /** Toggle'dan sonraki son durum — UI anlık tazelemek için. */
  following?: boolean;
}

/**
 * Takip et / takibi bırak toggle'ı. Aynı action iki yönde çalışır:
 * follow row yoksa oluşturur, varsa siler. Idempotent değil — UI
 * state'ini action sonucundan okumalı.
 *
 * Notification: ilk takipte `FOLLOWED` notifikasyonu gönderilir.
 * `notify` fire-and-forget (catch'te log) — ana akışı bloklamaz.
 */
export async function toggleFollowAction(
  targetUserId: string,
): Promise<FollowActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };
  const viewerId = session.user.id;

  if (viewerId === targetUserId) {
    return { success: false, error: "cannot-follow-self" };
  }

  const [viewer, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: viewerId },
      select: {
        id: true,
        username: true,
        name: true,
        suspendedAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true },
    }),
  ]);

  if (!viewer) return { success: false, error: "auth-required" };
  if (viewer.suspendedAt) return { success: false, error: "account-suspended" };
  if (!target) return { success: false, error: "target-not-found" };

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: targetUserId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    revalidatePath(`/profil/${target.username}`);
    revalidatePath("/akis");
    return { success: true, following: false };
  }

  await prisma.follow.create({
    data: { followerId: viewerId, followingId: targetUserId },
  });

  notifyFollowed({
    followedUserId: targetUserId,
    followerUsername: viewer.username,
    followerName: viewer.name,
  }).catch((err) => {
    console.error("[follow] notification failed:", err);
  });

  revalidatePath(`/profil/${target.username}`);
  revalidatePath("/akis");
  return { success: true, following: true };
}
