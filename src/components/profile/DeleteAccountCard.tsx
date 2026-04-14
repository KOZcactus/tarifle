"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { deleteAccountAction } from "@/lib/actions/profile";

interface DeleteAccountCardProps {
  /** Current user's handle — shown so the user knows exactly what to type. */
  username: string;
  /** When true the confirm form includes the password field. */
  hasPassword: boolean;
}

/**
 * Destructive "delete my account" card for /ayarlar. Rendered last on the
 * settings page under a danger-zone visual (red borders). Collapsed by
 * default — opening it requires an explicit click, so casual exploration
 * doesn't surface a delete button users might click by mistake.
 *
 * Server gates are the real safety net (see deleteAccountAction). UI gates
 * are purely UX:
 *  - Collapsed by default
 *  - "Hesabı Sil" opens the form
 *  - Must type exact username
 *  - Native `window.confirm` on final submit
 *  - Password field shown when hasPassword
 *
 * On success the component triggers `signOut({ callbackUrl: "/" })` —
 * server action already deleted the DB row, so the NextAuth session JWT is
 * meaningless; signOut clears the client cookie and sends the user home.
 */
export function DeleteAccountCard({
  username,
  hasPassword,
}: DeleteAccountCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmMatches = confirmInput.trim() === username;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    // Double-check with a native confirm dialog so a single misclick doesn't
    // nuke the account. Server still validates independently.
    const ok = window.confirm(
      "Hesabın kalıcı olarak silinecek. Tüm uyarlamaların, koleksiyonların, " +
        "beğenilerin ve bildirimlerin silinecek. Bu işlem geri alınamaz — " +
        "devam etmek istiyor musun?",
    );
    if (!ok) return;

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await deleteAccountAction(formData);
      if (!result.success) {
        setError(result.error ?? "Hesap silinemedi.");
        return;
      }
      // DB is gone; clear the session cookie and leave.
      await signOut({ callbackUrl: "/" });
    });
  };

  return (
    <section className="rounded-xl border border-error/40 bg-error/5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold text-error">
            Tehlikeli alan
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Hesabını kalıcı olarak silebilirsin. Bu işlem geri alınamaz.
            Uyarlamaların, koleksiyonların, beğenilerin ve bildirimlerin
            silinir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            setError(null);
            setConfirmInput("");
          }}
          aria-expanded={expanded}
          aria-controls="delete-account-form"
          className="shrink-0 rounded-md border border-error/40 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
        >
          {expanded ? "Kapat" : "Hesabı Sil"}
        </button>
      </div>

      {expanded && (
        <form
          id="delete-account-form"
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          <div>
            <label
              htmlFor="confirmUsername"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Onay
            </label>
            <p className="mb-2 text-xs text-text-muted">
              Devam etmek için kullanıcı adını olduğu gibi yaz:{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 text-text">
                {username}
              </code>
            </p>
            <input
              id="confirmUsername"
              name="confirmUsername"
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              required
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
            />
          </div>

          {hasPassword && (
            <div>
              <label
                htmlFor="delete-password"
                className="mb-1.5 block text-sm font-medium text-text"
              >
                Şifren
              </label>
              <input
                id="delete-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
              />
              <p className="mt-1 text-xs text-text-muted">
                Güvenlik için mevcut şifreni doğrulamamız lazım.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || !confirmMatches}
              className="rounded-lg bg-error px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Siliniyor…" : "Hesabı Kalıcı Olarak Sil"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
