import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * Admin-only manual cache invalidator. Manuel script'le DB'yi degistirdikten
 * sonra (server action akisi disinda) Next.js unstable_cache wrapper'lari
 * stale veri serve eder; bu endpoint targeted invalidation imkani verir.
 *
 * **Auth (iki yol, biri yeterli):**
 *   1. Admin session cookie (en kolay, tarayicidan dogrudan URL ac)
 *   2. Authorization: Bearer $ADMIN_REVALIDATE_SECRET (otomasyon icin)
 *
 * **Params:**
 *   - ?path=/tarif/<slug>  → o spesifik path'i revalidate
 *   - ?tag=recipes         → tag bazinda invalidate (tum 'recipes' cache'leri)
 *   - ?slug=<slug>         → kisayol: /tarif/<slug> path + 'recipes' tag
 *
 * **Usage (admin sen tarayicidan):**
 *   https://tarifle.app/api/admin/revalidate?slug=enginarli-domatesli-pide-manisa-usulu
 *
 * **Usage (otomasyon Bearer):**
 *   curl -H "Authorization: Bearer $SECRET" \
 *     "https://tarifle.app/api/admin/revalidate?slug=X"
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  // Yol 1: admin session cookie (admin sen tarayicidan ac, otomatik)
  const session = await auth();
  const isAdminSession = session?.user?.role === "ADMIN";

  // Yol 2: Bearer secret (otomasyon)
  let isAdminBearer = false;
  const secret = process.env.ADMIN_REVALIDATE_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader === `Bearer ${secret}`) {
      isAdminBearer = true;
    }
  }

  if (!isAdminSession && !isAdminBearer) {
    return NextResponse.json(
      { ok: false, error: "unauthorized (admin session veya Bearer secret gerek)" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const pathParam = url.searchParams.get("path");
  const tagParam = url.searchParams.get("tag");
  const slugParam = url.searchParams.get("slug");

  const actions: string[] = [];

  if (slugParam) {
    revalidatePath(`/tarif/${slugParam}`);
    revalidateTag("recipes", "default");
    actions.push(`path:/tarif/${slugParam}`, `tag:recipes`);
  }
  if (pathParam) {
    revalidatePath(pathParam);
    actions.push(`path:${pathParam}`);
  }
  if (tagParam) {
    revalidateTag(tagParam, "default");
    actions.push(`tag:${tagParam}`);
  }

  if (actions.length === 0) {
    return NextResponse.json(
      { ok: false, error: "missing param: path, tag, or slug required" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, revalidated: actions });
}
