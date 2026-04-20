import { auth } from "@/lib/auth";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
} from "@/lib/notifications/service";
import { NotificationBell } from "./NotificationBell";

/**
 * Server component that fetches the current user's notification state and
 * passes it into the (client) NotificationBell. Rendered inside layout.tsx
 * as a slot for the Navbar, this lets the bell's initial paint be driven
 * by an RSC query without turning Navbar itself into a server component.
 *
 * Returns `null` for anonymous users so logged-out visitors don't see the
 * bell at all.
 */
export async function NotificationBellLoader() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [unreadCount, items] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    getRecentNotifications({ userId: session.user.id, limit: 10 }),
  ]);

  return (
    <NotificationBell
      initialUnreadCount={unreadCount}
      initialItems={items.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        body: i.body,
        link: i.link,
        isRead: i.isRead,
        // Serialise the Date so the client boundary can marshal it.
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
