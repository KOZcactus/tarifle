"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NotificationType } from "@prisma/client";
import {
  markAllNotificationsReadAction,
  markNotificationsReadAction,
} from "@/lib/actions/notifications";
import { resolveNotificationLink } from "@/lib/notifications/link";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsListProps {
  items: NotificationItem[];
}

/**
 * Full /bildirimler page list. Similar to the dropdown but denser, with a
 * "mark all as read" button and per-item click-to-read. Doesn't auto-mark
 * everything read on mount, that's the dropdown's job. Here the user can
 * scan through unread items intentionally.
 */
export function NotificationsList({ items: initial }: NotificationsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unreadIds = items.filter((i) => !i.isRead).map((i) => i.id);

  const handleItemClick = (id: string) => {
    // Optimistic, flip the single item's read state.
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
    );
    startTransition(async () => {
      await markNotificationsReadAction([id]);
    });
  };

  const handleMarkAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  };

  return (
    <div>
      {unreadIds.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isPending}
            className="text-sm font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
          >
            Tümünü okundu işaretle
          </button>
        </div>
      )}

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
        {items.map((item) => {
          const dot = (
            <span
              aria-hidden="true"
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                item.isRead ? "bg-transparent" : "bg-primary"
              }`}
            />
          );

          const body = (
            <div className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-bg-elevated">
              {dot}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    item.isRead
                      ? "font-normal text-text-muted"
                      : "font-semibold text-text"
                  }`}
                >
                  {item.title}
                </p>
                {item.body && (
                  <p className="mt-1 text-sm text-text-muted">{item.body}</p>
                )}
                <p className="mt-1.5 text-xs text-text-muted">
                  {formatAbsolute(item.createdAt)}
                </p>
              </div>
              <TypeChip type={item.type} />
            </div>
          );

          // Type-aware link resolution overrides legacy stored links,
          // see lib/notifications/link.ts.
          const target = resolveNotificationLink(item.type, item.link);
          return (
            <li key={item.id}>
              {target ? (
                <Link
                  href={target}
                  onClick={() => handleItemClick(item.id)}
                  className="block"
                >
                  {body}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className="block w-full cursor-default text-left"
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Short, coloured tag on the right of each row so the user can scan by type
 * without reading every title. Maps to existing design tokens.
 */
function TypeChip({ type }: { type: NotificationType }) {
  const { label, classes } = CHIP_META[type] ?? {
    label: "Bildirim",
    classes: "bg-bg-elevated text-text-muted",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

const CHIP_META: Record<
  NotificationType,
  { label: string; classes: string }
> = {
  VARIATION_LIKED: { label: "Beğeni", classes: "bg-rose-500/15 text-rose-600" },
  VARIATION_APPROVED: {
    label: "Onay",
    classes: "bg-accent-green/15 text-accent-green",
  },
  VARIATION_HIDDEN: {
    label: "Moderasyon",
    classes: "bg-error/15 text-error",
  },
  REVIEW_APPROVED: {
    label: "Onay",
    classes: "bg-accent-green/15 text-accent-green",
  },
  REVIEW_HIDDEN: {
    label: "Moderasyon",
    classes: "bg-error/15 text-error",
  },
  REPORT_RESOLVED: {
    label: "Rapor",
    classes: "bg-accent-blue/15 text-accent-blue",
  },
  BADGE_AWARDED: {
    label: "Rozet",
    classes: "bg-secondary/20 text-secondary",
  },
  FOLLOWED: {
    label: "Takip",
    classes: "bg-accent-blue/15 text-accent-blue",
  },
  NEW_VARIATION_FROM_FOLLOWED: {
    label: "Uyarlama",
    classes: "bg-rose-500/15 text-rose-600",
  },
  SYSTEM: { label: "Sistem", classes: "bg-bg-elevated text-text-muted" },
};

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
