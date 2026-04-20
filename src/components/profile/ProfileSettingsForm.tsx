"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { updateProfileAction } from "@/lib/actions/profile";

interface ProfileSettingsFormProps {
  initialName: string;
  initialUsername: string;
  initialBio: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Profile editor for name / username / bio.
 *
 * Username is the tricky bit: changing it rewrites the user's public URL
 * (/profil/<new>), so after the server action succeeds we:
 *   1. Push the new fields into the NextAuth JWT via `session.update(...)`
 *     , this triggers the "update" branch of our jwt callback which
 *      forwards name/username/image into the token. Until this lands the
 *      navbar + session-aware components still show the old username.
 *   2. router.refresh() so server components re-read the fresh data.
 *   3. router.replace(`/profil/<new>`) so the old URL doesn't linger in
 *      history, much less confusing than leaving the user on /ayarlar
 *      with a stale "visit profile" link pointing at the old handle.
 */
export function ProfileSettingsForm({
  initialName,
  initialUsername,
  initialBio,
  email,
  emailVerified,
}: ProfileSettingsFormProps) {
  const t = useTranslations("settings.profile");
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const usernameChanged = username !== initialUsername;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (!result.success || !result.data) {
        setError(result.error ?? t("errorDefault"));
        return;
      }

      // Sync the JWT so Navbar + client session consumers pick up the
      // new values without a full refresh. See jwt callback in lib/auth.ts.
      await update({
        name: result.data.name,
        username: result.data.username,
        image: result.data.image,
      });

      setSuccess(true);

      if (result.previousUsername && result.previousUsername !== result.data.username) {
        router.refresh();
        router.replace(`/profil/${result.data.username}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-border bg-bg-card p-6"
    >
      {/* E-posta (read-only summary) */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {t("emailLabel")}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-text">
          {email}
          {emailVerified ? (
            <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[11px] font-medium text-accent-green">
              {t("emailVerified")}
            </span>
          ) : (
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-medium text-secondary">
              {t("emailUnverified")}
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {t("emailHelper")}
        </p>
      </section>

      <hr className="border-border" />

      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {t("nameLabel")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {t("usernameLabel")}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">{t("usernamePrefix")}</span>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            minLength={3}
            maxLength={30}
            autoComplete="off"
            pattern="[a-z][a-z0-9_\-]*"
            className="flex-1 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          {t.rich("usernameHelper", {
            code: (chunks) => <code>{chunks}</code>,
          })}
          {usernameChanged && (
            <>
              {" "}
              <span className="text-secondary">
                {t("usernameChangeWarning")}
              </span>
            </>
          )}
        </p>
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {t("bioLabel")}
        </label>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder={t("bioPlaceholder")}
          className="w-full resize-none rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-text-muted">
          {t("bioCounter", { count: bio.length })}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error}
        </div>
      )}
      {success && !error && (
        <div className="rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
          {t("successMessage")}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link
          href={`/profil/${initialUsername}`}
          className="text-sm text-text-muted hover:text-text"
        >
          {t("backToProfile")}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
