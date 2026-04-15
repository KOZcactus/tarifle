"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";

/**
 * Email-input form for the "forgot password" flow. We intentionally show the
 * same success panel whether or not an account exists for the email so a
 * visitor (or attacker) can't use this form to probe which addresses are
 * registered. The server action enforces the same non-leaky contract.
 */
export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string | null) ?? "").trim();

    const result = await requestPasswordResetAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Bir hata oluştu.");
      return;
    }
    setSubmittedEmail(email);
  }

  if (submittedEmail) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/15 text-2xl">
          ✉️
        </div>
        <h2 className="font-heading text-lg font-bold text-text">
          Bağlantı gönderildi
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          <strong className="text-text">{submittedEmail}</strong> adresine bir
          mail gönderdik. Bağlantı 1 saat geçerli. Görünmüyorsa spam/önemsiz
          klasörünü de kontrol et.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          Mail gelmediyse: adres bu sitede kayıtlı olmayabilir ya da hesabın
          Google ile bağlı olabilir — giriş sayfasından Google ile dene.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/giris"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Giriş sayfasına dön
          </Link>
          <button
            type="button"
            onClick={() => setSubmittedEmail(null)}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-text-muted hover:text-text"
          >
            Farklı adres dene
          </button>
        </div>
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
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            E-posta adresin
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="ornek@email.com"
          />
          <p className="mt-2 text-xs text-text-muted">
            Hesabına kayıtlı e-posta adresine bir sıfırlama bağlantısı
            göndereceğiz.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Şifreni hatırladın mı?{" "}
        <Link
          href="/giris"
          className="font-medium text-primary hover:text-primary-hover"
        >
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
