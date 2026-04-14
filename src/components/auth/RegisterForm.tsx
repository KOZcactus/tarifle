"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string | null) ?? "";
    const password = (formData.get("password") as string | null) ?? "";

    const result = await registerUser(formData);

    if (!result.success) {
      setError(result.error || "Bir hata oluştu.");
      setLoading(false);
      return;
    }

    // Server action created the account but did not sign in — do that here so
    // SessionProvider refreshes and the navbar flips to the logged-in state
    // without needing a hard reload.
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Hesap oluşturuldu ama giriş yapılamadı. Lütfen giriş sayfasından dene.");
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
        Google ile Kayıt Ol
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">veya</span>
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
            Ad Soyad
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Adınız Soyadınız"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="ornek@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="En az 6 karakter"
          />
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
            <Link href="/kvkk" className="text-primary hover:text-primary-hover" target="_blank">
              KVKK Aydınlatma Metni
            </Link>
            &apos;ni ve{" "}
            <Link href="/kullanim-sartlari" className="text-primary hover:text-primary-hover" target="_blank">
              Kullanım Şartları
            </Link>
            &apos;nı okudum, kabul ediyorum.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-primary hover:text-primary-hover">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}
