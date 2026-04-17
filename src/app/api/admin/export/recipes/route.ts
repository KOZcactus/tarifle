import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse, type CsvRow } from "@/lib/csv";
import { adminGuard } from "../_auth";

export const dynamic = "force-dynamic";

/**
 * CSV export of all recipes with admin-relevant metrics. Streamed format,
 * 1 row per recipe. Excel opens UTF-8 cleanly (BOM in csv.ts).
 *
 * Columns: slug, title, category, cuisine, type, difficulty, status,
 * isFeatured, viewCount, variationCount, reviewCount, bookmarkCount,
 * averageCalories, protein, carbs, fat, createdAt.
 */
export async function GET() {
  const blocked = await adminGuard();
  if (blocked) return blocked;

  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      title: true,
      emoji: true,
      type: true,
      difficulty: true,
      status: true,
      isFeatured: true,
      viewCount: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      cuisine: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: {
        select: { variations: true, reviews: true, bookmarks: true },
      },
    },
  });

  const headers = [
    "slug",
    "title",
    "emoji",
    "category",
    "cuisine",
    "type",
    "difficulty",
    "status",
    "isFeatured",
    "viewCount",
    "variationCount",
    "reviewCount",
    "bookmarkCount",
    "averageCalories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "createdAt",
  ];
  const rows: CsvRow[] = recipes.map((r) => [
    r.slug,
    r.title,
    r.emoji ?? "",
    r.category.name,
    r.cuisine ?? "",
    r.type,
    r.difficulty,
    r.status,
    r.isFeatured,
    r.viewCount,
    r._count.variations,
    r._count.reviews,
    r._count.bookmarks,
    r.averageCalories ?? "",
    r.protein?.toString() ?? "",
    r.carbs?.toString() ?? "",
    r.fat?.toString() ?? "",
    r.createdAt,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(headers, rows), `tarifle-recipes-${stamp}.csv`);
}
