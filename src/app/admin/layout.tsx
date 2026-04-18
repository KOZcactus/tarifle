import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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

  const t = await getTranslations("admin.layout");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t("panelTitle")}</h1>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {user.role}
        </span>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
        <NavLink href="/admin">{t("overview")}</NavLink>
        <NavLink href="/admin/incelemeler">{t("reviews")}</NavLink>
        <NavLink href="/admin/raporlar">{t("reports")}</NavLink>
        <NavLink href="/admin/tarifler">{t("recipes")}</NavLink>
        <NavLink href="/admin/kullanicilar">{t("users")}</NavLink>
        <NavLink href="/admin/koleksiyonlar">{t("collections")}</NavLink>
        <NavLink href="/admin/kategoriler">{t("categories")}</NavLink>
        <NavLink href="/admin/etiketler">{t("tags")}</NavLink>
        <NavLink href="/admin/duyurular">{t("announcements")}</NavLink>
        <NavLink href="/admin/bildirim-gonder">{t("notification")}</NavLink>
        <NavLink href="/admin/moderasyon-logu">{t("log")}</NavLink>
        <NavLink href="/sentry-test">{t("sentryTest")}</NavLink>
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
