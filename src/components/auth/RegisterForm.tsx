"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { registerUser } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const tDivider = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // K1 P2 #5 (oturum 26): Password strength indicator state.
  // Custom inline 4-level heuristic, no zxcvbn (~300KB) dependency.
  // Score: 0=zayıf, 1=orta, 2=iyi, 3=güçlü.
  const [password, setPassword] = useState("");

  function passwordStrength(pw: string): { score: number; label: string } {
    if (pw.length === 0) return { score: -1, label: "" };
    let s = 0;
    if (pw.length >= 12) s++;
    if (pw.length >= 16) s++;
    const variety =
      Number(/[a-z]/.test(pw)) +
      Number(/[A-Z]/.test(pw)) +
      Number(/[0-9]/.test(pw)) +
      Number(/[^a-zA-Z0-9]/.test(pw));
    if (variety >= 3) s++;
    if (variety >= 4) s++;
    const score = Math.min(3, s);
    const labels = [
      t("strengthWeak"),
      t("strengthFair"),
      t("strengthGood"),
      t("strengthStrong"),
    ];
    return { score, label: labels[score] };
  }
  const pwStrength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string | null) ?? "";
    const password = (formData.get("password") as string | null) ?? "";

    const result = await registerUser(formData);

    if (!result.success) {
      setError(result.error || t("errors.default"));
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError(t("errors.signInAfter"));
      return;
    }

    router.refresh();
    router.push("/");
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-6 shadow-sm">
      {/* Google Sign Up */}
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
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
        {t("googleButton")}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">{tDivider("orDivider")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text">
            {t("nameLabel")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("namePlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">
            {t("emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("emailPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
            {t("passwordLabel")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-strength"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("passwordPlaceholder")}
          />
          {/* K1 P2 #5: Password strength visual indicator. 4-level bar
              (zayıf/orta/iyi/güçlü) + a11y aria-live polite. score=-1 ise
              hidden (input boş). */}
          {pwStrength.score >= 0 && (
            <div
              id="password-strength"
              role="status"
              aria-live="polite"
              className="mt-2 flex items-center gap-2"
            >
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= pwStrength.score
                        ? pwStrength.score >= 3
                          ? "bg-accent-green"
                          : pwStrength.score === 2
                            ? "bg-secondary"
                            : pwStrength.score === 1
                              ? "bg-amber-500"
                              : "bg-error"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-xs font-medium ${
                  pwStrength.score >= 3
                    ? "text-accent-green"
                    : pwStrength.score === 2
                      ? "text-secondary"
                      : pwStrength.score === 1
                        ? "text-amber-500"
                        : "text-error"
                }`}
              >
                {pwStrength.label}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            id="kvkkAccepted"
            name="kvkkAccepted"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="kvkkAccepted" className="text-sm text-text-muted">
            {t.rich("consent", {
              kvkk: (chunks) => (
                <Link
                  href="/kvkk"
                  className="text-primary hover:text-primary-hover"
                  target="_blank"
                >
                  {chunks}
                </Link>
              ),
              terms: (chunks) => (
                <Link
                  href="/kullanim-sartlari"
                  className="text-primary hover:text-primary-hover"
                  target="_blank"
                >
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        {t("haveAccount")}{" "}
        <Link href="/giris" className="font-medium text-primary hover:text-primary-hover">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
