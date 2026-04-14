import Link from "next/link";
import type { Metadata } from "next";
import { consumeVerificationToken } from "@/lib/email/verification";

export const metadata: Metadata = {
  title: "E-posta Doğrulama",
  // Doğrulama linkleri Google'a sızmasın diye index'leme
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { token } = await params;
  const result = await consumeVerificationToken(token);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      {result.success ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15 text-3xl">
            ✓
          </div>
          <h1 className="font-heading text-2xl font-bold text-text">
            E-postan doğrulandı
          </h1>
          <p className="mt-2 text-text-muted">
            Artık <strong>{result.email}</strong> adresi hesabına bağlı. &ldquo;Doğrulanmış kullanıcı&rdquo; rozetin profilinde görünecek.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Ana sayfaya dön
          </Link>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/15 text-3xl text-error">
            ⚠
          </div>
          <h1 className="font-heading text-2xl font-bold text-text">
            Doğrulama başarısız
          </h1>
          <p className="mt-2 text-text-muted">
            {result.reason === "expired"
              ? "Bu doğrulama bağlantısının süresi dolmuş. Profilinden yenisini iste."
              : "Bu doğrulama bağlantısı geçersiz. Daha önce kullanılmış ya da hatalı olabilir."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/giris"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Giriş yap
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-muted hover:text-text"
            >
              Ana sayfa
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
