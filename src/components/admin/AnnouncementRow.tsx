"use client";

import { useState } from "react";
import { AnnouncementForm } from "./AnnouncementForm";

interface Props {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  variant: "INFO" | "WARNING" | "SUCCESS";
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
}

const VARIANT_META: Record<Props["variant"], { label: string; classes: string }> = {
  INFO: { label: "Bilgi", classes: "bg-accent-blue/15 text-accent-blue" },
  WARNING: { label: "Uyarı", classes: "bg-warning/15 text-warning" },
  SUCCESS: { label: "Başarı", classes: "bg-accent-green/15 text-accent-green" },
};

function fmtDateShort(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isActive(startsAt: Date | null, endsAt: Date | null): boolean {
  const now = new Date();
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

export function AnnouncementRow(props: Props) {
  const [editing, setEditing] = useState(false);
  const meta = VARIANT_META[props.variant];
  const active = isActive(props.startsAt, props.endsAt);

  if (editing) {
    return (
      <li className="p-4">
        <AnnouncementForm
          initial={{
            id: props.id,
            title: props.title,
            body: props.body,
            link: props.link,
            variant: props.variant,
            startsAt: props.startsAt,
            endsAt: props.endsAt,
          }}
          onClose={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.classes}`}>
          {meta.label}
        </span>
        {active ? (
          <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-medium text-accent-green">
            ● Aktif
          </span>
        ) : (
          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
            Pasif
          </span>
        )}
        <span className="min-w-0 flex-1 truncate font-medium text-text">
          {props.title}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded border border-border px-2 py-0.5 text-xs hover:bg-bg-elevated"
        >
          Düzenle
        </button>
      </div>
      {props.body && (
        <p className="text-xs text-text-muted">{props.body}</p>
      )}
      <p className="text-[11px] text-text-muted tabular-nums">
        {fmtDateShort(props.startsAt)} → {fmtDateShort(props.endsAt)}
      </p>
    </li>
  );
}
