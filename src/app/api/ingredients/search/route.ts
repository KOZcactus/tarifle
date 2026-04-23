import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  rateLimitIdentifier,
} from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

// Cache ingredient popularity list in memory (warm reloads across requests).
// 3021 recipes * ~6 ingredients = ~18k rows, distinct names ~2000. Safe size.
let CACHE: { name: string; count: number }[] | null = null;
let CACHE_AT = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getIngredientIndex(): Promise<{ name: string; count: number }[]> {
  const now = Date.now();
  if (CACHE && now - CACHE_AT < CACHE_TTL_MS) return CACHE;
  const rows = await prisma.recipeIngredient.groupBy({
    by: ["name"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  CACHE = rows.map((r) => ({ name: r.name, count: r._count.id }));
  CACHE_AT = now;
  return CACHE;
}

function trLower(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı");
}

/**
 * Returns ingredient suggestions matching the query. Case + locale aware
 * (Turkish collation), ranked by recipe usage count, capped at 10.
 *
 * Query semantics:
 *   - Empty / <2 chars → top-10 most common ingredients (cold start)
 *   - 2+ chars → startsWith first, then includes; dedup across both.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  const ip = session?.user?.id ? null : await getClientIp();
  const rate = await checkRateLimit(
    "ingredient-autocomplete",
    rateLimitIdentifier(session?.user?.id, ip),
  );
  if (!rate.success) {
    return NextResponse.json(
      { suggestions: [], error: rate.message ?? "Rate limit" },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const qRaw = (url.searchParams.get("q") ?? "").trim();
  const q = trLower(qRaw);
  const index = await getIngredientIndex();

  if (q.length < 2) {
    // Cold suggestions: top 10 popular ingredients.
    return NextResponse.json({
      suggestions: index.slice(0, 10).map((i) => i.name),
    });
  }

  const starts: { name: string; count: number }[] = [];
  const contains: { name: string; count: number }[] = [];
  for (const row of index) {
    const name = trLower(row.name);
    if (name === q) continue; // exact match redundant
    if (name.startsWith(q)) {
      starts.push(row);
    } else if (name.includes(q)) {
      contains.push(row);
    }
    if (starts.length + contains.length >= 40) break; // quick cap
  }
  const combined = [...starts, ...contains].slice(0, 10).map((i) => i.name);
  return NextResponse.json({ suggestions: combined });
}
