"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/notifications/service";

interface ActionResult {
  success: boolean;
  error?: string;
  updated?: number;
}

/**
 * Mark a specific set of notifications as read. Only affects the caller's own
 * rows, the service-layer `where` clause enforces that server-side, so even
 * a tampered form submission can't touch someone else's inbox.
 */
export async function markNotificationsReadAction(
  ids: string[],
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısın." };
  }

  const cleanIds = ids.filter((id) => typeof id === "string" && id.length > 0);
  if (cleanIds.length === 0) return { success: true, updated: 0 };

  const updated = await markNotificationsRead({
    userId: session.user.id,
    ids: cleanIds,
  });
  revalidatePath("/bildirimler");
  return { success: true, updated };
}

/** Mark every unread notification for the current user as read. */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısın." };
  }
  const updated = await markAllNotificationsRead(session.user.id);
  revalidatePath("/bildirimler");
  return { success: true, updated };
}
