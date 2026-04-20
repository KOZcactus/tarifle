import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getRecentNotifications } from "@/lib/notifications/service";
import { NotificationsList } from "@/components/notifications/NotificationsList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.notifications");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

// Personal inbox, request-time only. No static prerender.
export const dynamic = "force-dynamic";

interface NotificationsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("notifications"),
  ]);
  if (!session?.user?.id) {
    redirect("/giris?callbackUrl=/bildirimler");
  }

  const { filter } = await searchParams;
  const onlyUnread = filter === "unread";

  const items = await getRecentNotifications({
    userId: session.user.id,
    limit: 50,
    onlyUnread,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text">{t("pageTitle")}</h1>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/bildirimler"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              onlyUnread
                ? "text-text-muted hover:bg-bg-card"
                : "bg-bg-card font-medium text-text"
            }`}
          >
            {t("filterAll")}
          </Link>
          <Link
            href="/bildirimler?filter=unread"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              onlyUnread
                ? "bg-bg-card font-medium text-text"
                : "text-text-muted hover:bg-bg-card"
            }`}
          >
            {t("filterUnread")}
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-text-muted">
            {onlyUnread ? t("emptyUnread") : t("emptyAll")}
          </p>
        </div>
      ) : (
        <NotificationsList
          items={items.map((i) => ({
            id: i.id,
            type: i.type,
            title: i.title,
            body: i.body,
            link: i.link,
            isRead: i.isRead,
            createdAt: i.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
