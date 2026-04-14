"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/lib/actions/profile";

interface PasswordChangeCardProps {
  /**
   * True when the user has a `passwordHash` in the DB (registered with
   * credentials). False for Google-only accounts — we show an informative
   * message instead of the form in that case.
   */
  hasPassword: boolean;
}

/**
 * Password rotation form on /ayarlar. Collapsed by default so it doesn't
 * dominate the settings page — users who need it expand it deliberately.
 * On success the form resets and shows a brief confirmation; on failure the
 * server's TR error message surfaces inline. Session isn't invalidated —
 * the user stays logged in with their existing JWT, which uses AUTH_SECRET
 * not the old password so that's still valid.
 */
export function PasswordChangeCard({ hasPassword }: PasswordChangeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!hasPassword) {
    return (
      <section className="rounded-xl border border-border bg-bg-card p-6">
        <h2 className="font-heading text-base font-semibold text-text">
          Şifre
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Hesabını Google ile açtığın için şifren yok. Google hesabından giriş
          yapmaya devam edebilirsin; ileride ayarlar sayfasından bir şifre
          ekleme seçeneği eklenecek.
        </p>
      </section>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result.success) {
        setSuccess(true);
        form.reset();
        // Auto-collapse after a beat so the user sees the success banner
        // then the card calms down. 2.5s is long enough to read.
        setTimeout(() => {
          setSuccess(false);
          setExpanded(false);
        }, 2500);
      } else {
        setError(result.error ?? "Şifre değiştirilemedi.");
      }
    });
  };

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold text-text">
            Şifre
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Güvenlik için şifreni ara sıra değiştir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            setError(null);
            setSuccess(false);
          }}
          aria-expanded={expanded}
          aria-controls="password-change-form"
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {expanded ? "Kapat" : "Şifre Değiştir"}
        </button>
      </div>

      {expanded && (
        <form
          id="password-change-form"
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
        >
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Mevcut şifre
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Yeni şifre
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-text-muted">
              En az 8 karakter. Kolay tahmin edilmeyen bir şey seç.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Yeni şifre (tekrar)
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green"
            >
              Şifren güncellendi.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? "Güncelleniyor…" : "Şifreyi Güncelle"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
