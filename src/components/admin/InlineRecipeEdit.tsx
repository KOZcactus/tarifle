"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateRecipeAction } from "@/lib/actions/admin";

interface BaseProps {
  recipeId: string;
}

interface TextEditProps extends BaseProps {
  field: "title" | "emoji" | "description";
  value: string;
  multiline?: boolean;
  label: string;
  maxLength?: number;
}

/**
 * Inline text / emoji / description edit. Başlangıçta salt-okuma, kaleme
 * tıklanınca input açılır. Esc iptal, Enter (textarea için Ctrl+Enter)
 * submit. Server action'a patch tek field ile gönderir.
 */
export function InlineRecipeText({
  recipeId,
  field,
  value,
  multiline = false,
  label,
  maxLength = 200,
}: TextEditProps) {
  const t = useTranslations("admin.inlineEdit");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function commit() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateRecipeAction({
        recipeId,
        patch: { [field]: draft },
      });
      if (res.success) {
        setEditing(false);
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? t("saveFailed"));
      }
    });
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group inline-flex items-center gap-1.5 text-left hover:text-primary"
        aria-label={`${label} · ${t("editButton")}`}
      >
        <span>{value || <span className="italic text-text-muted">(boş)</span>}</span>
        <span
          aria-hidden="true"
          className="text-xs text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
        >
          ✎
        </span>
      </button>
    );
  }

  if (multiline) {
    return (
      <div className="flex flex-col gap-1">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) commit();
          }}
          maxLength={maxLength}
          rows={3}
          autoFocus
          aria-label={label}
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-text-muted">
            {draft.length}/{maxLength}, {t("ctrlEnterHint")}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded border border-border px-2 py-1 text-text-muted hover:bg-bg-elevated"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={pending || draft.trim().length === 0}
              className="rounded bg-primary px-2 py-1 text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {pending ? t("saving") : t("save")}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          if (e.key === "Enter") commit();
        }}
        maxLength={maxLength}
        autoFocus
        aria-label={label}
        className="min-w-[60px] rounded border border-border bg-bg-card px-2 py-0.5 text-inherit focus:border-primary focus:outline-none"
        style={{ width: `${Math.max(draft.length + 2, 8)}ch` }}
      />
      <button
        type="button"
        onClick={commit}
        disabled={pending || draft.trim().length === 0}
        className="rounded bg-primary px-2 py-0.5 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "…" : "✓"}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="rounded border border-border px-2 py-0.5 text-xs text-text-muted hover:bg-bg-elevated"
      >
        ✕
      </button>
      {error && <span className="ml-1 text-xs text-error">{error}</span>}
    </div>
  );
}

interface StatusEditProps extends BaseProps {
  value: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "HIDDEN" | "REJECTED";
}

const STATUS_VALUES: StatusEditProps["value"][] = [
  "PUBLISHED",
  "HIDDEN",
  "DRAFT",
  "PENDING_REVIEW",
  "REJECTED",
];

const STATUS_LABEL_KEY: Record<StatusEditProps["value"], string> = {
  PUBLISHED: "statusPublished",
  HIDDEN: "statusHidden",
  DRAFT: "statusDraft",
  PENDING_REVIEW: "statusPendingReview",
  REJECTED: "statusDraft", // fallback key
};

export function InlineRecipeStatus({ recipeId, value }: StatusEditProps) {
  const t = useTranslations("admin.inlineEdit");
  const tRecipes = useTranslations("admin.recipes");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: StatusEditProps["value"]) {
    if (next === value) return;
    if (next === "HIDDEN" && !confirm(t("statusHideConfirm"))) return;

    startTransition(async () => {
      const res = await updateRecipeAction({
        recipeId,
        patch: { status: next },
      });
      if (res.success) {
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? t("saveFailed"));
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => change(e.target.value as StatusEditProps["value"])}
        disabled={pending}
        aria-label={t("statusLabel")}
        className="rounded border border-border bg-bg-card px-2 py-0.5 text-xs focus:border-primary focus:outline-none"
      >
        {STATUS_VALUES.map((v) => (
          <option key={v} value={v}>
            {tRecipes.has(STATUS_LABEL_KEY[v]) ? tRecipes(STATUS_LABEL_KEY[v]) : v}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-text-muted">…</span>}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

interface FeaturedToggleProps extends BaseProps {
  value: boolean;
}

export function InlineRecipeFeatured({ recipeId, value }: FeaturedToggleProps) {
  const t = useTranslations("admin.inlineEdit");
  const tDashboard = useTranslations("admin.dashboard");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    startTransition(async () => {
      const res = await updateRecipeAction({
        recipeId,
        patch: { isFeatured: !value },
      });
      if (res.success) {
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? t("saveFailed"));
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={value}
        aria-label={t("featuredLabel")}
        className={`inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
          value
            ? "border-secondary/40 bg-secondary/30"
            : "border-border bg-bg-elevated"
        } disabled:opacity-50`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-xs text-text-muted">
        {value ? tDashboard("featuredBadge") : t("featuredNo")}
      </span>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
