"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { unlinkGoogleAction } from "@/lib/actions/profile";

interface GoogleLinkCardProps {
  /** Whether the current user already has a Google Account row linked. */
  linked: boolean;
  /** Email the user signed up with, shown to set expectations about matching. */
  email: string;
  /**
   * Whether the user has a `passwordHash`. Unlink is gated on this at both
   * the server and the UI: without a password, unlinking the Google account
   * would leave no way in at all, so we disable the control.
   */
  hasPassword: boolean;
  /** Success/error flags read from the /ayarlar URL so we can show toasts. */
  linkResult?: "success" | "mismatch" | "session" | null;
}

/**
 * Settings card for the Google OAuth linking flow.
 *
 * Two-step start so the server gate (signed cookie) is in place before the
 * real OAuth request ever leaves our origin:
 *   1. POST /api/link/google/set-intent, sets the signed HMAC cookie that
 *      auth.ts's `signIn` callback keys off. Returns 200 JSON, no redirect
 *      so the browser doesn't pre-navigate.
 *   2. `signIn("google", { callbackUrl })`, NextAuth client helper fetches
 *      a CSRF token and POSTs to the signin endpoint, which redirects to
 *      Google. This is the step that needs a real form submission + CSRF;
 *      a plain server-side 303 to /api/auth/signin/google would just land
 *      back on our custom /giris page (no CSRF → Auth.js shows the sign-in
 *      UI instead of redirecting out).
 *
 * If the cookie write fails (auth expired, etc.) we bail and let the user
 * retry rather than dropping them at Google with no linking context.
 */
export function GoogleLinkCard({
  linked,
  email,
  hasPassword,
  linkResult,
}: GoogleLinkCardProps) {
  const t = useTranslations("settings.google");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [unlinkSuccess, setUnlinkSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isUnlinking, startUnlinking] = useTransition();

  const handleUnlink = () => {
    setError(null);
    setUnlinkSuccess(false);
    const ok = window.confirm(t("confirmUnlink"));
    if (!ok) return;
    startUnlinking(async () => {
      const result = await unlinkGoogleAction();
      if (!result.success) {
        setError(result.error ?? t("unlinkError"));
        return;
      }
      setUnlinkSuccess(true);
      // Refresh the server component so the card flips back to "bağla"
      // without the user needing to reload manually.
      router.refresh();
    });
  };

  const handleLink = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/link/google/set-intent", {
        method: "POST",
      });
      if (!res.ok) {
        setBusy(false);
        setError(res.status === 401 ? t("sessionExpired") : t("startError"));
        return;
      }
      // Now hand control to Auth.js, this will redirect to Google.
      await signIn("google", { callbackUrl: "/ayarlar?linked=1" });
    } catch {
      setBusy(false);
      setError(t("unexpectedError"));
    }
  };

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold text-text">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {linked
              ? t("descriptionLinked", { email })
              : t("descriptionUnlinked")}
          </p>
        </div>
        {linked && (
          <span className="shrink-0 rounded-full bg-accent-green/15 px-3 py-1 text-xs font-semibold text-accent-green">
            {t("linkedBadge")}
          </span>
        )}
      </div>

      {/* Result banners from the URL query (server-provided) */}
      {linkResult === "success" && (
        <div
          role="status"
          className="mt-4 rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green"
        >
          {t("linkSuccessBanner")}
        </div>
      )}
      {linkResult === "mismatch" && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          {t.rich("mismatchBanner", {
            email: () => <strong>{email}</strong>,
          })}
        </div>
      )}
      {linkResult === "session" && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          {t("sessionBanner")}
        </div>
      )}

      {/* Unlink success, surfaced locally because there's no ?unlinked URL
          param; router.refresh() will also re-render the card to "bağla"
          state, but this banner gives the user confirmation during that
          re-render window. */}
      {unlinkSuccess && (
        <div
          role="status"
          className="mt-4 rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green"
        >
          {t("unlinkSuccessBanner")}
        </div>
      )}

      {/* Client-side error (fetch failed, 401, etc.) */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error}
        </div>
      )}

      {/* Unlink control, only when linked. Disabled + warning when the user
          has no password, because removing the only sign-in path would lock
          them out. The server enforces the same rule; the disabled state is
          UX, not security. */}
      {linked && (
        <div className="mt-4">
          {!hasPassword && (
            <p className="mb-2 text-xs text-text-muted">
              {t("needPasswordHint")}
            </p>
          )}
          <button
            type="button"
            onClick={handleUnlink}
            disabled={isUnlinking || !hasPassword}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-error hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnlinking ? t("unlinking") : t("unlink")}
          </button>
        </div>
      )}

      {!linked && (
        <button
          type="button"
          onClick={handleLink}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {busy ? t("linking") : t("link")}
        </button>
      )}
    </section>
  );
}
