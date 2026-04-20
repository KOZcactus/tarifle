"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { resetPasswordAction } from "@/lib/actions/auth";

interface ResetPasswordFormProps {
  token: string;
}

/**
 * New-password form shown after the user clicks a reset link from their mail.
 * On success we do NOT auto-sign-in: we deliberately send the user to /giris
 * so the next session uses the fresh password end-to-end (keeps logic simple
 * and rules out any "password rotated but old session still valid on this
 * device" confusion).
 */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // The hidden token input carries the url param, the action layer is the
    // single place that validates it against the DB.
    formData.set("token", token);

    const result = await resetPasswordAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? t("errorDefault"));
      return;
    }
    setDone(true);
    // Give the user a beat to see the success state, then land them on the
    // login page with a prefill query so the success strip shows there too.
    setTimeout(() => {
      router.push("/giris?reset=ok");
    }, 1200);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/15 text-2xl">
          ✓
        </div>
        <h2 className="font-heading text-lg font-bold text-text">
          {t("doneTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {t("doneBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="newPassword"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            {t("newPasswordLabel")}
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            autoFocus
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("newPasswordPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            {t("confirmLabel")}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("confirmPlaceholder")}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        {t("brokenLinkQuestion")}{" "}
        <Link
          href="/sifremi-unuttum"
          className="font-medium text-primary hover:text-primary-hover"
        >
          {t("requestNew")}
        </Link>
      </p>
    </div>
  );
}
