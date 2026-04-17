import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Centralised notification creation. Every trigger point in the app (like,
 * badge grant, moderation decision, report resolution) funnels through
 * `createNotification` so callers never need to think about Prisma shape or
 * the cleanup caveats below.
 *
 * Callers should use the specialised helpers (`notifyVariationLiked`,
 * `notifyBadgeAwarded`, ...) whenever possible — they encode the correct TR
 * copy and link format so every notification of the same type reads the same.
 * The raw `createNotification` is exported only for future ad-hoc events.
 *
 * IMPORTANT: all helpers are "best-effort". If the insert throws (DB down,
 * user deleted, whatever) the caller's primary action must NOT fail. Wrap
 * every call with `.catch(err => console.error(...))`.
 */

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const data: Prisma.NotificationCreateInput = {
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    user: { connect: { id: input.userId } },
  };
  await prisma.notification.create({ data });
}

/**
 * Someone liked a variation the given user authored. Self-likes are skipped
 * at the caller — this helper assumes author !== liker.
 */
export async function notifyVariationLiked(params: {
  authorId: string;
  likerName: string | null;
  recipeSlug: string;
  variationTitle: string;
}): Promise<void> {
  const who = params.likerName?.trim() || "Biri";
  await createNotification({
    userId: params.authorId,
    type: "VARIATION_LIKED",
    title: `${who} uyarlamanı beğendi`,
    body: `"${params.variationTitle}" uyarlamanı beğenen yeni biri var.`,
    link: `/tarif/${params.recipeSlug}`,
  });
}

/** Admin approved a pending variation. */
export async function notifyVariationApproved(params: {
  authorId: string;
  recipeSlug: string;
  variationTitle: string;
}): Promise<void> {
  await createNotification({
    userId: params.authorId,
    type: "VARIATION_APPROVED",
    title: "Uyarlaman yayınlandı",
    body: `"${params.variationTitle}" adlı uyarlaman incelendi ve yayına alındı.`,
    link: `/tarif/${params.recipeSlug}`,
  });
}

/** Admin hid or rejected a variation. */
export async function notifyVariationHidden(params: {
  authorId: string;
  recipeSlug: string;
  variationTitle: string;
  reason?: string | null;
}): Promise<void> {
  const bodyCore = `"${params.variationTitle}" adlı uyarlaman moderasyon ekibi tarafından gizlendi.`;
  const body = params.reason ? `${bodyCore} Sebep: ${params.reason}` : bodyCore;
  await createNotification({
    userId: params.authorId,
    type: "VARIATION_HIDDEN",
    title: "Uyarlaman gizlendi",
    body,
    // Hidden uyarlama tarif sayfasında zaten görünmüyor — kullanıcıyı
    // tarife yönlendirmek "kayboldu" hissi verir. Bildirimler sayfasına
    // götürüp orada sebep + zaman damgasını görmesini sağlıyoruz.
    link: "/bildirimler",
  });
}

/** Admin hid a review authored by the user. */
export async function notifyReviewHidden(params: {
  authorId: string;
  recipeSlug: string;
  recipeTitle: string;
  reason?: string | null;
}): Promise<void> {
  const bodyCore = `"${params.recipeTitle}" tarifine yazdığın yorum moderasyon ekibi tarafından gizlendi.`;
  const body = params.reason ? `${bodyCore} Sebep: ${params.reason}` : bodyCore;
  await createNotification({
    userId: params.authorId,
    type: "REVIEW_HIDDEN",
    title: "Yorumun gizlendi",
    // Same reasoning as variation-hidden: don't send them to a tarif page
    // where their content is gone; point at bildirimler so they see the
    // reason in-context.
    body,
    link: "/bildirimler",
  });
}

/** Admin approved a review that was flagged by preflight. */
export async function notifyReviewApproved(params: {
  authorId: string;
  recipeSlug: string;
  recipeTitle: string;
}): Promise<void> {
  await createNotification({
    userId: params.authorId,
    type: "REVIEW_APPROVED",
    title: "Yorumun yayınlandı",
    body: `"${params.recipeTitle}" tarifine yazdığın yorum incelendi ve yayına alındı.`,
    link: `/tarif/${params.recipeSlug}`,
  });
}

/** A report the user filed was resolved by moderation. */
export async function notifyReportResolved(params: {
  reporterId: string;
  outcome: "upheld" | "dismissed";
  targetTitle?: string | null;
}): Promise<void> {
  const base = params.targetTitle
    ? `Bildirdiğin "${params.targetTitle}" içeriği için inceleme tamamlandı.`
    : "Bildirdiğin içerik için inceleme tamamlandı.";
  const verdict =
    params.outcome === "upheld"
      ? "İçerik kaldırıldı; katkın için teşekkürler."
      : "İnceleme sonucunda herhangi bir işlem yapılmadı.";
  await createNotification({
    userId: params.reporterId,
    type: "REPORT_RESOLVED",
    title: "Raporun sonuçlandı",
    body: `${base} ${verdict}`,
  });
}

/** A badge was awarded to the user. */
export async function notifyBadgeAwarded(params: {
  userId: string;
  badgeLabel: string;
  emoji?: string | null;
}): Promise<void> {
  const emoji = params.emoji ? `${params.emoji} ` : "";
  await createNotification({
    userId: params.userId,
    type: "BADGE_AWARDED",
    title: `${emoji}Yeni rozet: ${params.badgeLabel}`,
    body: `"${params.badgeLabel}" rozetini kazandın. Profilinde görebilirsin.`,
    link: "/profil/me",
  });
}

/**
 * Mark the given notification IDs as read, scoped to the user so one user
 * can't flip another's notifications. Returns how many rows were updated.
 */
export async function markNotificationsRead(params: {
  userId: string;
  ids: string[];
}): Promise<number> {
  if (params.ids.length === 0) return 0;
  const result = await prisma.notification.updateMany({
    where: {
      userId: params.userId,
      id: { in: params.ids },
      isRead: false,
    },
    data: { isRead: true },
  });
  return result.count;
}

/** Mark every unread notification for the user as read. */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return result.count;
}

/** Unread count for the bell badge. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/** Most-recent-first, default 20. Caller handles read/unread filter. */
export async function getRecentNotifications(params: {
  userId: string;
  limit?: number;
  onlyUnread?: boolean;
}): Promise<
  {
    id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }[]
> {
  const take = Math.min(Math.max(params.limit ?? 20, 1), 100);
  return prisma.notification.findMany({
    where: {
      userId: params.userId,
      ...(params.onlyUnread ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      isRead: true,
      createdAt: true,
    },
  });
}
