"use server";

/**
 * Niş admin ops — v7 paketi:
 *  - User suspend/unsuspend
 *  - Announcement CRUD
 *  - Collection hide/unhide
 *  - Notification broadcast
 *
 * Bu dosya diğer admin action'larından ayrıldı (admin.ts variation+review
 * moderation + edit, admin-taxonomy.ts tag/category). Artan sayı için
 * ayrı dosya daha temiz.
 */

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmalısınız.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("Yetkiniz yok.");
  }
  return session.user.id;
}

type ActionResult = { success: boolean; error?: string };

// ─── User suspension ──────────────────────────────────────

const suspendUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

export async function suspendUserAction(input: unknown): Promise<ActionResult> {
  const moderatorId = await requireAdmin();
  const parsed = suspendUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const { userId, reason } = parsed.data;

  if (userId === moderatorId) {
    return { success: false, error: "Kendi hesabını askıya alamazsın." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, username: true, suspendedAt: true },
  });
  if (!target) return { success: false, error: "Kullanıcı bulunamadı." };
  if (target.role === "ADMIN") {
    return { success: false, error: "ADMIN hesabı askıya alınamaz." };
  }
  if (target.suspendedAt) {
    return { success: false, error: "Zaten askıda." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: new Date(), suspendedReason: reason ?? null },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "user",
        targetId: userId,
        action: "SUSPEND",
        reason: reason ?? null,
      },
    }),
    // Invalidate any live sessions — next JWT callback will reject the token.
    // Session table'ı kullanmayan credentials flow'u direct clear edilemez
    // ama session callback'e suspendedAt check eklendi (auth.ts).
  ]);

  revalidatePath("/admin");
  if (target.username) revalidatePath(`/admin/kullanicilar/${target.username}`);
  return { success: true };
}

export async function unsuspendUserAction(input: unknown): Promise<ActionResult> {
  const moderatorId = await requireAdmin();
  const parsed = z.object({ userId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Geçersiz." };

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { username: true, suspendedAt: true },
  });
  if (!target) return { success: false, error: "Kullanıcı bulunamadı." };
  if (!target.suspendedAt) return { success: true }; // no-op, zaten aktif

  await prisma.$transaction([
    prisma.user.update({
      where: { id: parsed.data.userId },
      data: { suspendedAt: null, suspendedReason: null },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "user",
        targetId: parsed.data.userId,
        action: "UNSUSPEND",
      },
    }),
  ]);

  revalidatePath("/admin");
  if (target.username) revalidatePath(`/admin/kullanicilar/${target.username}`);
  return { success: true };
}

// ─── Announcement CRUD ────────────────────────────────────

const announcementSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().max(1000).optional(),
  link: z.string().trim().url().max(500).optional().or(z.literal("")),
  variant: z.enum(["INFO", "WARNING", "SUCCESS"]).default("INFO"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

function parseDateOrNull(s: string | undefined): Date | null {
  if (!s || s.trim() === "") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function createAnnouncementAction(
  input: unknown,
): Promise<ActionResult> {
  const moderatorId = await requireAdmin();
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const data = parsed.data;

  await prisma.announcement.create({
    data: {
      title: data.title,
      body: data.body || null,
      link: data.link || null,
      variant: data.variant,
      startsAt: parseDateOrNull(data.startsAt),
      endsAt: parseDateOrNull(data.endsAt),
      createdBy: moderatorId,
    },
  });

  revalidatePath("/admin/duyurular");
  revalidatePath("/", "layout");
  return { success: true };
}

const updateAnnouncementSchema = z.object({
  id: z.string().min(1),
  patch: announcementSchema.partial(),
});

export async function updateAnnouncementAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const { id, patch } = parsed.data;
  // Build the actual Prisma data — trim strings / parse dates
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.body !== undefined) data.body = patch.body || null;
  if (patch.link !== undefined) data.link = patch.link || null;
  if (patch.variant !== undefined) data.variant = patch.variant;
  if (patch.startsAt !== undefined) data.startsAt = parseDateOrNull(patch.startsAt);
  if (patch.endsAt !== undefined) data.endsAt = parseDateOrNull(patch.endsAt);

  try {
    await prisma.announcement.update({ where: { id }, data });
  } catch {
    return { success: false, error: "Duyuru bulunamadı." };
  }

  revalidatePath("/admin/duyurular");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAnnouncementAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Geçersiz." };

  await prisma.announcement.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/duyurular");
  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Collection hide/unhide ───────────────────────────────

const hideCollectionSchema = z.object({
  collectionId: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

export async function hideCollectionAction(
  input: unknown,
): Promise<ActionResult> {
  const moderatorId = await requireAdmin();
  const parsed = hideCollectionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Geçersiz." };

  const coll = await prisma.collection.findUnique({
    where: { id: parsed.data.collectionId },
    select: { id: true, hiddenAt: true },
  });
  if (!coll) return { success: false, error: "Koleksiyon bulunamadı." };
  if (coll.hiddenAt) return { success: true };

  await prisma.$transaction([
    prisma.collection.update({
      where: { id: coll.id },
      data: { hiddenAt: new Date(), hiddenReason: parsed.data.reason ?? null },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "collection",
        targetId: coll.id,
        action: "HIDE",
        reason: parsed.data.reason ?? null,
      },
    }),
  ]);
  revalidatePath("/admin/koleksiyonlar");
  return { success: true };
}

export async function unhideCollectionAction(
  input: unknown,
): Promise<ActionResult> {
  const moderatorId = await requireAdmin();
  const parsed = z
    .object({ collectionId: z.string().min(1) })
    .safeParse(input);
  if (!parsed.success) return { success: false, error: "Geçersiz." };

  const coll = await prisma.collection.findUnique({
    where: { id: parsed.data.collectionId },
    select: { hiddenAt: true },
  });
  if (!coll) return { success: false, error: "Koleksiyon bulunamadı." };
  if (!coll.hiddenAt) return { success: true };

  await prisma.$transaction([
    prisma.collection.update({
      where: { id: parsed.data.collectionId },
      data: { hiddenAt: null, hiddenReason: null },
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "collection",
        targetId: parsed.data.collectionId,
        action: "APPROVE",
      },
    }),
  ]);
  revalidatePath("/admin/koleksiyonlar");
  return { success: true };
}

// ─── Notification broadcast ───────────────────────────────

const broadcastSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().max(1000).optional(),
  link: z.string().trim().max(500).optional(),
  /** Hedef filtre: null/undefined = herkes, "USER" = sadece normal üyeler, vb. */
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
  /** Sadece e-posta doğrulananlar mı? */
  onlyVerified: z.boolean().optional(),
});

export async function broadcastNotificationAction(
  input: unknown,
): Promise<{ success: boolean; error?: string; count?: number }> {
  const moderatorId = await requireAdmin();
  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz." };
  }
  const { title, body, link, role, onlyVerified } = parsed.data;

  // Select matching users — askıya alınmışlar dahil edilmez.
  const where: Record<string, unknown> = { suspendedAt: null, deletedAt: null };
  if (role) where.role = role;
  if (onlyVerified) where.emailVerified = { not: null };

  const targets = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  if (targets.length === 0) {
    return { success: false, error: "Hedef kullanıcı bulunamadı." };
  }

  // Bulk insert + log audit.
  await prisma.$transaction([
    prisma.notification.createMany({
      data: targets.map((u) => ({
        userId: u.id,
        type: "SYSTEM" as const,
        title,
        body: body || null,
        link: link || null,
      })),
    }),
    prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: "broadcast",
        targetId: `count=${targets.length}`,
        action: "BROADCAST",
        reason: `${title}${body ? ` — ${body}` : ""}`.slice(0, 500),
      },
    }),
  ]);

  revalidatePath("/admin");
  return { success: true, count: targets.length };
}
