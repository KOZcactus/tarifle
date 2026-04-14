import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/giris");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Yönetim Paneli</h1>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {user.role}
        </span>
      </div>

      <nav className="mb-8 flex gap-2 border-b border-border pb-4">
        <NavLink href="/admin">Genel Bakış</NavLink>
        <NavLink href="/admin/raporlar">Raporlar</NavLink>
        <NavLink href="/admin/tarifler">Tarifler</NavLink>
        <NavLink href="/admin/kullanicilar">Kullanıcılar</NavLink>
      </nav>

      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-card hover:text-text"
    >
      {children}
    </Link>
  );
}
