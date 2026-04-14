import type { NotificationType } from "@prisma/client";

/**
 * Single source of truth for "where should clicking this notification take
 * the user?". Lives outside the create helpers so legacy DB rows (whose
 * `link` was set with the old logic) get the right destination on render
 * — we override based on type rather than trusting the stored link.
 *
 * VARIATION_HIDDEN intentionally returns `/bildirimler`: the variation is
 * not visible on the recipe page anymore, so sending the user there is
 * confusing. Bildirimler page shows the moderator's note + timestamp so
 * the author can read why.
 *
 * Returns `null` when the notification has no useful destination (system
 * messages without context). Callers should render the row as a plain
 * <button> in that case so it still marks-as-read on click.
 */
export function resolveNotificationLink(
  type: NotificationType,
  storedLink: string | null,
): string | null {
  switch (type) {
    case "VARIATION_HIDDEN":
      // Always route hidden notifications to the inbox, ignore stored link.
      return "/bildirimler";
    case "VARIATION_LIKED":
    case "VARIATION_APPROVED":
      // Stored link is the recipe URL — content is live, take user there.
      return storedLink ?? null;
    case "BADGE_AWARDED":
      return storedLink ?? "/bildirimler";
    case "REPORT_RESOLVED":
      // Reporter doesn't own a target page; inbox makes sense for context.
      return storedLink ?? "/bildirimler";
    case "SYSTEM":
      return storedLink ?? null;
    default:
      return storedLink ?? null;
  }
}
