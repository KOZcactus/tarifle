import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse, type CsvRow } from "@/lib/csv";
import { adminGuard } from "../_auth";

export const dynamic = "force-dynamic";

/**
 * CSV export of all users with activity metrics. Public fields only +
 * email (admin görür). Avatar/bio dışarıda, moderasyon odağında.
 */
export async function GET() {
  const blocked = await adminGuard();
  if (blocked) return blocked;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      username: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          variations: true,
          reviews: true,
          bookmarks: true,
          reports: true,
          collections: true,
        },
      },
    },
  });

  const headers = [
    "username",
    "name",
    "email",
    "role",
    "isVerified",
    "emailVerified",
    "variationCount",
    "reviewCount",
    "bookmarkCount",
    "reportCount",
    "collectionCount",
    "createdAt",
  ];
  const rows: CsvRow[] = users.map((u) => [
    u.username ?? "",
    u.name ?? "",
    u.email ?? "",
    u.role,
    u.isVerified,
    u.emailVerified ?? "",
    u._count.variations,
    u._count.reviews,
    u._count.bookmarks,
    u._count.reports,
    u._count.collections,
    u.createdAt,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(headers, rows), `tarifle-users-${stamp}.csv`);
}
