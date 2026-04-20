import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchRecipeIds } from "@/lib/search/recipe-search";

/**
 * RecipePickerDialog için lightweight arama endpoint'i. Girilen query
 * için FTS rank + lookup → minimal RecipeHit (title, emoji, süre, slug,
 * difficulty). Tek liste döner, pagination yok, max 20 sonuç.
 *
 * Auth zorunlu: sadece giriş yapmış user meal plan kullanabilir ve
 * search endpoint'ini de üyesel tutarak bot trafiğini engelliyoruz.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return NextResponse.json({ recipes: [] });
  }

  const ranked = await searchRecipeIds({ query, limit: 20 });
  if (ranked.length === 0) {
    return NextResponse.json({ recipes: [] });
  }

  const rows = await prisma.recipe.findMany({
    where: {
      id: { in: ranked.map((r) => r.id) },
      status: "PUBLISHED",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      emoji: true,
      totalMinutes: true,
      difficulty: true,
    },
  });

  // FTS sırasını koru.
  const rankByIndex = new Map(ranked.map((r, idx) => [r.id, idx]));
  rows.sort(
    (a, b) =>
      (rankByIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (rankByIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );

  return NextResponse.json({ recipes: rows });
}
