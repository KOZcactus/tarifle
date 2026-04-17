"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/lib/actions/admin";

interface BaseProps {
  userId: string;
}

interface RoleEditProps extends BaseProps {
  value: "USER" | "MODERATOR" | "ADMIN";
  /** True only if current session is ADMIN (backend checks too, this gates UI). */
  canEditRole: boolean;
}

const ROLE_OPTIONS: { value: RoleEditProps["value"]; label: string }[] = [
  { value: "USER", label: "USER" },
  { value: "MODERATOR", label: "MODERATOR" },
  { value: "ADMIN", label: "ADMIN" },
];

export function InlineUserRole({ userId, value, canEditRole }: RoleEditProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: RoleEditProps["value"]) {
    if (next === value) return;
    if (
      next === "ADMIN" &&
      !confirm(`Kullanıcıya ADMIN yetkisi vermek istediğine emin misin?`)
    ) {
      return;
    }
    startTransition(async () => {
      const res = await updateUserAction({
        userId,
        patch: { role: next },
      });
      if (res.success) {
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? "Güncellenemedi.");
      }
    });
  }

  if (!canEditRole) {
    // Fallback: chip only
    return (
      <span
        className={`rounded px-2 py-0.5 text-xs font-medium ${
          value === "ADMIN"
            ? "bg-primary/10 text-primary"
            : value === "MODERATOR"
              ? "bg-accent-blue/10 text-accent-blue"
              : "bg-bg-elevated text-text-muted"
        }`}
      >
        {value}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => change(e.target.value as RoleEditProps["value"])}
        disabled={pending}
        aria-label="Rol"
        className="rounded border border-border bg-bg-card px-2 py-0.5 text-xs focus:border-primary focus:outline-none"
      >
        {ROLE_OPTIONS.map((o) => (
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

interface VerifiedToggleProps extends BaseProps {
  value: boolean;
}

export function InlineUserVerified({ userId, value }: VerifiedToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    startTransition(async () => {
      const res = await updateUserAction({
        userId,
        patch: { isVerified: !value },
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
        aria-label={value ? "Tarifle ekibinden çıkar" : "Tarifle ekibi yap"}
        className={`inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
          value
            ? "border-accent-blue/40 bg-accent-blue/30"
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
        {value ? "Tarifle ekibi ✓" : "Normal üye"}
      </span>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
