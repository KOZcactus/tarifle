interface GoogleLinkCardProps {
  /** Whether the current user already has a Google Account row linked. */
  linked: boolean;
  /** Email the user signed up with — shown to set expectations about matching. */
  email: string;
  /** Success/error flags read from the /ayarlar URL so we can show toasts. */
  linkResult?: "success" | "mismatch" | "session" | null;
}

/**
 * Settings card for the Google OAuth linking flow. Renders either a "bağla"
 * CTA (POSTs to /api/link/google/start) or a "bağlı" chip with the email.
 *
 * Intentionally a server component + plain form — no client state needed.
 * The POST action sets a signed cookie then 302s to the OAuth provider;
 * everything after that is standard Auth.js + our signIn callback.
 */
export function GoogleLinkCard({ linked, email, linkResult }: GoogleLinkCardProps) {
  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold text-text">
            Google hesabı
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {linked
              ? `Hesabın şu Google kimliğiyle bağlı: ${email}. Bir sonraki girişinde "Google ile Giriş Yap" seçip parola girmeden girebilirsin.`
              : "Google ile giriş yapabilmek için hesabını bağlayabilirsin. Yalnızca üyelik e-postan ile aynı olan Google hesabı bağlanabilir."}
          </p>
        </div>
        {linked && (
          <span className="shrink-0 rounded-full bg-accent-green/15 px-3 py-1 text-xs font-semibold text-accent-green">
            Bağlı
          </span>
        )}
      </div>

      {/* Result banners (read from URL ?linked / ?linkError) */}
      {linkResult === "success" && (
        <div
          role="status"
          className="mt-4 rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green"
        >
          Google hesabın başarıyla bağlandı.
        </div>
      )}
      {linkResult === "mismatch" && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          Seçtiğin Google hesabı (<strong>{email}</strong> ile kayıtlı değil).
          Hesabını bağlamak için aynı e-postaya sahip Google kimliğini seçmelisin.
        </div>
      )}
      {linkResult === "session" && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
        >
          Bağlama isteği süresi doldu. Lütfen tekrar dene.
        </div>
      )}

      {!linked && (
        <form
          action="/api/link/google/start"
          method="POST"
          className="mt-4"
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            Google hesabını bağla
          </button>
        </form>
      )}
    </section>
  );
}
