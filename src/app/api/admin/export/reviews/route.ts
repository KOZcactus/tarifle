import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse, type CsvRow } from "@/lib/csv";
import { adminGuard } from "../_auth";

export const dynamic = "force-dynamic";

/**
 * CSV export of all reviews across all statuses (PUBLISHED + HIDDEN +
 * PENDING_REVIEW). Analytics için: rating dağılımı, en çok yorum alan
 * tarifler, moderasyon oranı.
 */
export async function GET() {
  const blocked = await adminGuard();
  if (blocked) return blocked;

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      rating: true,
      comment: true,
      status: true,
      moderationFlags: true,
      hiddenReason: true,
      createdAt: true,
      recipe: { select: { slug: true, title: true } },
      user: { select: { username: true } },
    },
  });

  const headers = [
    "recipeSlug",
    "recipeTitle",
    "username",
    "rating",
    "status",
    "moderationFlags",
    "hiddenReason",
    "comment",
    "createdAt",
  ];
  const rows: CsvRow[] = reviews.map((r) => [
    r.recipe.slug,
    r.recipe.title,
    r.user.username ?? "",
    r.rating,
    r.status,
    r.moderationFlags ?? "",
    r.hiddenReason ?? "",
    r.comment ?? "",
    r.createdAt,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(headers, rows), `tarifle-reviews-${stamp}.csv`);
}
