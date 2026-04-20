"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  changePasswordAction,
  setPasswordAction,
} from "@/lib/actions/profile";

interface PasswordChangeCardProps {
  /**
   * True when the user has a `passwordHash` in the DB (registered with
   * credentials). False for Google-only accounts, in that case we show
   * the "add a password" form instead of the change form.
   */
  hasPassword: boolean;
}

/**
 * Shared card for rotating an existing password or adding a first-time
 * password to a Google-only account. Two forms branch on `hasPassword`:
 *
 *   - hasPassword=true (credentials user) → current + new + confirm,
 *     server action `changePasswordAction` verifies the current pw via
 *     bcrypt before rotation.
 *   - hasPassword=false (OAuth-only) → new + confirm, server action
 *     `setPasswordAction` verifies `passwordHash` is still null so a bug
 *     in this component can't bypass the change flow's bcrypt check.
 *
 * Both share the rate-limit scope + the same visual shell.
 */
export function PasswordChangeCard({ hasPassword }: PasswordChangeCardProps) {
  const t = useTranslations("settings.password");
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mode: "change" | "set" = hasPassword ? "change" : "set";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result =
        mode === "change"
          ? await changePasswordAction(formData)
          : await setPasswordAction(formData);
      if (result.success) {
        setSuccess(true);
        form.reset();
        // Auto-collapse after a beat so the success banner gets read, then
        // the card quiets down.
        setTimeout(() => {
          setSuccess(false);
          setExpanded(false);
        }, 2500);
      } else {
        setError(
          result.error ??
            (mode === "change" ? t("errorChange") : t("errorSet")),
        );
      }
    });
  };

  const title = t("title");
  const description =
    mode === "change" ? t("descriptionChange") : t("descriptionSet");
  const toggleLabel = mode === "change" ? t("toggleChange") : t("toggleSet");
  const submitLabel = mode === "change" ? t("submitChange") : t("submitSet");
  const submitPending =
    mode === "change" ? t("submittingChange") : t("submittingSet");
  const successMessage =
    mode === "change" ? t("successChange") : t("successSet");

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold text-text">
            {title}
          </h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
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
          {expanded ? t("closeButton") : toggleLabel}
        </button>
      </div>

      {expanded && (
        <form
          id="password-change-form"
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
        >
          {mode === "change" && (
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-1.5 block text-sm font-medium text-text"
              >
                {t("currentPasswordLabel")}
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
          )}

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              {mode === "change" ? t("newPasswordLabelChange") : t("newPasswordLabelSet")}
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
              {t("newPasswordHelper")}
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              {mode === "change" ? t("confirmPasswordLabelChange") : t("confirmPasswordLabelSet")}
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
              {successMessage}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? submitPending : submitLabel}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
