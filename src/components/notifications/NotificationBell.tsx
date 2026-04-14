"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { useDismiss } from "@/hooks/useDismiss";
import {
  markAllNotificationsReadAction,
  markNotificationsReadAction,
} from "@/lib/actions/notifications";

export interface NotificationBellItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string; // ISO — serialisable over the RSC boundary
}

interface NotificationBellProps {
  initialUnreadCount: number;
  initialItems: NotificationBellItem[];
}

/**
 * Bell icon + dropdown for the navbar. Takes its initial data from the server
 * component parent so the first paint shows the correct count without a
 * client-side fetch. Marks items read optimistically on open; on outside
 * click or Escape the dropdown closes via useDismiss.
 *
 * The dropdown itself is server-time cached — we don't poll. A future pass
 * could add SWR or a tab-focus refetch to surface new items without reload.
 */
export function NotificationBell({
  initialUnreadCount,
  initialItems,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>({ isOpen: open, onClose: close });

  /**
   * Toggle open state. When we're opening (not closing), mark every currently
   * unread item as read so the badge clears without the user touching each
   * one. Optimistic UI flips immediately; the server write happens in a
   * transition. On error we roll back so the badge reappears — silent sync
   * failures would be worse than a stale badge.
   *
   * This lives in the click handler rather than a useEffect because the
   * "run this when open flips to true" pattern is exactly what React 19's
   * no-setState-in-effect rule targets — handlers are the correct home.
   */
  const handleToggle = () => {
    setOpen((wasOpen) => {
      if (wasOpen) return false;
      const unreadIds = items.filter((i) => !i.isRead).map((i) => i.id);
      if (unreadIds.length > 0) {
        setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
        setUnreadCount(0);
        startTransition(async () => {
          const result = await markNotificationsReadAction(unreadIds);
          if (!result.success) {
            setItems(initialItems);
            setUnreadCount(initialUnreadCount);
          }
        });
      }
      return true;
    });
  };

  const handleMarkAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notifications-menu"
        aria-label={
          unreadCount > 0
            ? `Bildirimler (${unreadCount} okunmamış)`
            : "Bildirimler"
        }
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifications-menu"
          role="menu"
          aria-label="Bildirimler"
          className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-bg-card shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h3 className="text-sm font-semibold text-text">Bildirimler</h3>
            {items.some((i) => !i.isRead) ? (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isPending}
                className="text-xs text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
              >
                Tümünü okundu işaretle
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-muted">
                Henüz bildirimin yok.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const inner = (
                    <div className="flex gap-3 px-4 py-3 transition-colors hover:bg-bg-elevated">
                      {!item.isRead && (
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                        />
                      )}
                      <div className={item.isRead ? "pl-5" : ""}>
                        <p className="text-sm font-medium text-text">
                          {item.title}
                        </p>
                        {item.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                            {item.body}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-text-muted">
                          {formatRelative(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={item.id} role="menuitem">
                      {item.link ? (
                        <Link href={item.link} onClick={close} className="block">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5 text-center">
            <Link
              href="/bildirimler"
              onClick={close}
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Tümünü gör →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/**
 * "şimdi" / "3 dk önce" / "2 saat önce" / "Dün" / "14 Nis" — client-side
 * formatter. Intentionally coarse so we don't need a heavy date lib.
 */
function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));

  if (diff < 30) return "şimdi";
  if (diff < 60) return `${diff} sn önce`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;

  const date = new Date(iso);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
