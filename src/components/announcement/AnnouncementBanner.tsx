"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type AnnouncementVariant = "INFO" | "WARNING" | "SUCCESS";

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  variant: AnnouncementVariant;
}

interface Props {
  announcements: PublicAnnouncement[];
}

const DISMISSED_KEY = "tarifle-dismissed-announcements";

const VARIANT_CLASSES: Record<AnnouncementVariant, string> = {
  INFO: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
  WARNING: "bg-warning/10 text-warning border-warning/30",
  SUCCESS: "bg-accent-green/10 text-accent-green border-accent-green/30",
};

const VARIANT_ICON: Record<AnnouncementVariant, string> = {
  INFO: "ℹ️",
  WARNING: "⚠️",
  SUCCESS: "✓",
};

/**
 * Site-wide duyuru banner'ı. Aktif duyuruları sunucuda çekiyoruz, client
 * tarafı yalnızca "kullanıcı bu ID'yi kapattı mı" kontrolünü yapıyor
 * (localStorage). Backend'e yazmıyoruz — dismissal persist user-scope
 * değil device-scope, schema değişikliği gerektirmez.
 *
 * Birden fazla aktif duyuru varsa en yenisi üstte; kullanıcı her birini
 * tek tek kapatır.
 */
export function AnnouncementBanner({ announcements }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Load dismissed ids once on mount — external source sync pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        setDismissed(new Set(ids));
      }
    } catch {
      // localStorage unavailable — ignore, all announcements visible
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
    } catch {
      // Storage quota / private mode — UI hâlâ gizlenir, sadece persist olmaz
    }
  }

  // Server'dan gelen + henüz dismissed olmayanlar
  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (!hydrated || visible.length === 0) return null;

  return (
    <div className="space-y-1 border-b border-border bg-bg-elevated/30">
      {visible.map((a) => (
        <div
          key={a.id}
          role="status"
          className={`flex items-start gap-3 border-b px-4 py-2 text-sm last:border-b-0 ${VARIANT_CLASSES[a.variant]}`}
        >
          <span aria-hidden="true" className="shrink-0">
            {VARIANT_ICON[a.variant]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {a.link ? (
                <Link href={a.link} className="hover:underline">
                  {a.title}
                </Link>
              ) : (
                a.title
              )}
            </p>
            {a.body && (
              <p className="mt-0.5 text-xs opacity-80">{a.body}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(a.id)}
            aria-label="Kapat"
            className="shrink-0 rounded p-0.5 text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
