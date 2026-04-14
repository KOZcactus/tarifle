import type { BadgeKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BADGES } from "./config";
import { notifyBadgeAwarded } from "@/lib/notifications/service";

const COLLECTOR_THRESHOLD = 5;
const POPULAR_THRESHOLD = 10;

/**
 * Idempotent badge grant. Safe to call multiple times — uses a unique
 * constraint, so concurrent inserts won't double-award.
 *
 * On a *new* grant (not a no-op retry) we fire-and-forget a notification.
 * The notification write is wrapped so a notifications-table outage can't
 * unwind the badge grant.
 */
export async function grantBadge(userId: string, key: BadgeKey): Promise<boolean> {
  try {
    await prisma.userBadge.create({ data: { userId, key } });
    // Real new award → notify. Meta is fixed at import time, never throws.
    const meta = BADGES[key];
    notifyBadgeAwarded({
      userId,
      badgeLabel: meta.label,
      emoji: meta.emoji,
    }).catch((err) => console.error("[badges] notification failed:", err));
    return true;
  } catch (err: unknown) {
    // P2002 = unique violation → user already has this badge
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return false;
    }
    throw err;
  }
}

/**
 * Award the EMAIL_VERIFIED badge — call after consumeVerificationToken.
 */
export async function awardEmailVerifiedBadge(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return;
  await grantBadge(user.id, "EMAIL_VERIFIED");
}

/**
 * Award FIRST_VARIATION on the first variation a user creates.
 * No-op if they already have it.
 */
export async function awardFirstVariationBadge(userId: string): Promise<void> {
  // Cheap pre-check to avoid the failed-insert path on the hot create path.
  const existing = await prisma.userBadge.findUnique({
    where: { userId_key: { userId, key: "FIRST_VARIATION" } },
  });
  if (existing) return;
  await grantBadge(userId, "FIRST_VARIATION");
}

/**
 * Award POPULAR_VARIATION when one of the user's variations crosses the
 * like threshold. Called after toggleLike — only checks the touched
 * variation's author, not all of the user's variations.
 */
export async function maybeAwardPopularBadge(variationId: string): Promise<void> {
  const variation = await prisma.variation.findUnique({
    where: { id: variationId },
    select: { authorId: true, likeCount: true },
  });
  if (!variation || variation.likeCount < POPULAR_THRESHOLD) return;
  await grantBadge(variation.authorId, "POPULAR_VARIATION");
}

/**
 * Award RECIPE_COLLECTOR after the user has 5+ collections. Called after
 * collection create.
 */
export async function maybeAwardCollectorBadge(userId: string): Promise<void> {
  const count = await prisma.collection.count({ where: { userId } });
  if (count < COLLECTOR_THRESHOLD) return;
  await grantBadge(userId, "RECIPE_COLLECTOR");
}

export async function getUserBadges(userId: string) {
  return prisma.userBadge.findMany({
    where: { userId },
    orderBy: { awardedAt: "desc" },
    select: { key: true, awardedAt: true },
  });
}
