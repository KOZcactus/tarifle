import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kullanıcılar | Yönetim Paneli" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: { variations: true, bookmarks: true, reports: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="mb-4 font-heading text-xl font-bold">
        Kullanıcılar ({users.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="pb-3 pr-4">Kullanıcı</th>
              <th className="pb-3 pr-4">E-posta</th>
              <th className="pb-3 pr-4">Rol</th>
              <th className="pb-3 pr-4 text-right">Uyarlama</th>
              <th className="pb-3 pr-4 text-right">Kayıt</th>
              <th className="pb-3 text-right">Rapor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-bg-card">
                <td className="py-3 pr-4">
                  <div>
                    <p className="font-medium text-text">
                      {u.name || u.username}
                      {u.isVerified && (
                        <span className="ml-1 text-xs text-accent-blue">✓</span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">@{u.username}</p>
                  </div>
                </td>
                <td className="py-3 pr-4 text-text-muted">{u.email}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      u.role === "ADMIN"
                        ? "bg-primary/10 text-primary"
                        : u.role === "MODERATOR"
                          ? "bg-accent-blue/10 text-accent-blue"
                          : "bg-bg-elevated text-text-muted"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right text-text-muted">
                  {u._count.variations}
                </td>
                <td className="py-3 pr-4 text-right text-text-muted">
                  {u._count.bookmarks}
                </td>
                <td className="py-3 text-right text-text-muted">
                  {u._count.reports}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
