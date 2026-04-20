"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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

const VARIANT_CLASSES: Record<Props["variant"], string> = {
  INFO: "bg-accent-blue/15 text-accent-blue",
  WARNING: "bg-warning/15 text-warning",
  SUCCESS: "bg-accent-green/15 text-accent-green",
};

const VARIANT_LABEL_KEYS: Record<Props["variant"], string> = {
  INFO: "variantInfo",
  WARNING: "variantWarning",
  SUCCESS: "variantSuccess",
};

function fmtDateShort(d: Date | null, locale: string, placeholder: string): string {
  if (!d) return placeholder;
  return new Date(d).toLocaleString(locale, {
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
  const t = useTranslations("admin.announcements");
  const tInline = useTranslations("admin.inlineEdit");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const variantLabel = t(VARIANT_LABEL_KEYS[props.variant]);
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
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${VARIANT_CLASSES[props.variant]}`}>
          {variantLabel}
        </span>
        {active ? (
          <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-medium text-accent-green">
            ● {t("rowActiveBadge")}
          </span>
        ) : (
          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
            {t("rowExpiredBadge")}
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
          {tInline("editButton")}
        </button>
      </div>
      {props.body && (
        <p className="text-xs text-text-muted">{props.body}</p>
      )}
      <p className="text-[11px] text-text-muted tabular-nums">
        {fmtDateShort(props.startsAt, locale, ",")} → {fmtDateShort(props.endsAt, locale, ",")}
      </p>
    </li>
  );
}
