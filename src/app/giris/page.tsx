import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Giriş Yap | Tarifle",
  description: "Tarifle hesabınıza giriş yapın.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-text">Giriş Yap</h1>
          <p className="mt-2 text-text-muted">
            Tarifle&apos;a giriş yap ve topluluğa katıl.
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
