import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Şifre Sıfırlama | Tarifle",
  // Reset bağlantıları Google'a sızmasın diye index dışı.
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Checks whether a reset-token row is still usable. Extracted so that the
 * impure `Date.now()` call lives outside the component body — the React 19
 * purity rule (`react-hooks/purity`) flags calling impure functions during
 * render even inside Server Components.
 */
function classifyToken(
  record: { expires: Date } | null,
): { valid: boolean; expired: boolean } {
  if (!record) return { valid: false, expired: false };
  const expired = record.expires.getTime() < Date.now();
  return { valid: !expired, expired };
}

/**
 * Renders the new-password form if the token exists and is unexpired, else
 * shows a friendly explanation with a link back to the request page. We do
 * NOT consume the token here — only the form submit action does, so a user
 * refreshing the page does not lose the opportunity to use their link.
 */
export default async function ResetPasswordPage({ params }: PageProps) {
  // If someone is already signed in, push them to /ayarlar instead — the
  // in-product change-password form is safer (mevcut şifre required).
  const session = await auth();
  if (session) redirect("/ayarlar");

  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { expires: true },
  });
  const { valid, expired } = classifyToken(record);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-text">
            Yeni şifreni belirle
          </h1>
          <p className="mt-2 text-text-muted">
            {valid
              ? "Bağlantın aktif. Aşağıdan yeni şifreni ayarlayabilirsin."
              : "Bu bağlantı çalışmıyor — aşağıdan yeni bir tane isteyebilirsin."}
          </p>
        </div>
        {valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-xl border border-border bg-bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/15 text-2xl text-error">
              ⚠
            </div>
            <h2 className="font-heading text-lg font-bold text-text">
              Bağlantı geçersiz
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {expired
                ? "Sıfırlama bağlantısının süresi dolmuş. Yeni bir tane iste, 1 saat içinde kullanabilirsin."
                : "Bu bağlantı geçersiz. Daha önce kullanılmış ya da hatalı kopyalanmış olabilir."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/sifremi-unuttum"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Yeni bağlantı iste
              </Link>
              <Link
                href="/giris"
                className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-text-muted hover:text-text"
              >
                Giriş sayfası
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
