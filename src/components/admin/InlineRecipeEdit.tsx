"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
        setError(res.error ?? "Güncellenemedi.");
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
        aria-label={`${label} düzenle`}
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
            {draft.length}/{maxLength} — Ctrl+Enter ile kaydet, Esc iptal
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded border border-border px-2 py-1 text-text-muted hover:bg-bg-elevated"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={pending || draft.trim().length === 0}
              className="rounded bg-primary px-2 py-1 text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {pending ? "…" : "Kaydet"}
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

const STATUS_OPTIONS: {
  value: StatusEditProps["value"];
  label: string;
  classes: string;
}[] = [
  { value: "PUBLISHED", label: "Yayında", classes: "bg-accent-green/15 text-accent-green" },
  { value: "HIDDEN", label: "Gizli", classes: "bg-error/15 text-error" },
  { value: "DRAFT", label: "Taslak", classes: "bg-bg-elevated text-text-muted" },
  { value: "PENDING_REVIEW", label: "İncelemede", classes: "bg-secondary/20 text-secondary" },
  { value: "REJECTED", label: "Reddedildi", classes: "bg-error/15 text-error" },
];

export function InlineRecipeStatus({ recipeId, value }: StatusEditProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: StatusEditProps["value"]) {
    if (next === value) return;
    const confirmMsg =
      next === "HIDDEN"
        ? "Tarifi gizlemek istediğine emin misin? Public sayfadan kaybolur."
        : null;
    if (confirmMsg && !confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await updateRecipeAction({
        recipeId,
        patch: { status: next },
      });
      if (res.success) {
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? "Güncellenemedi.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => change(e.target.value as StatusEditProps["value"])}
        disabled={pending}
        aria-label="Tarif durumu"
        className="rounded border border-border bg-bg-card px-2 py-0.5 text-xs focus:border-primary focus:outline-none"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
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
        setError(res.error ?? "Güncellenemedi.");
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
        aria-label={value ? "Featured'dan çıkar" : "Featured yap"}
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
        {value ? "Featured" : "Normal"}
      </span>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
