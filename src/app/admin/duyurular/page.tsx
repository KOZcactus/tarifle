import { getAdminAnnouncements } from "@/lib/queries/admin";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { AnnouncementRow } from "@/components/admin/AnnouncementRow";

export const metadata = {
  title: "Duyurular | Yönetim Paneli",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await getAdminAnnouncements();

  const now = new Date();
  const activeCount = announcements.filter((a) => {
    if (a.startsAt && a.startsAt > now) return false;
    if (a.endsAt && a.endsAt < now) return false;
    return true;
  }).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          Duyurular ({announcements.length})
        </h2>
        <p className="text-xs text-text-muted">
          {activeCount} aktif duyuru
        </p>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-text">+ Yeni duyuru</h3>
        <AnnouncementForm />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        {announcements.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            Henüz duyuru yok.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {announcements.map((a) => (
              <AnnouncementRow
                key={a.id}
                id={a.id}
                title={a.title}
                body={a.body}
                link={a.link}
                variant={a.variant}
                startsAt={a.startsAt}
                endsAt={a.endsAt}
                createdAt={a.createdAt}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
