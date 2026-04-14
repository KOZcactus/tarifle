import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Kayıt Ol | Tarifle",
  description: "Tarifle'a üye olun, tariflerinizi paylaşın.",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-text">Kayıt Ol</h1>
          <p className="mt-2 text-text-muted">
            Ücretsiz hesap oluştur ve tariflere katkıda bulun.
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
