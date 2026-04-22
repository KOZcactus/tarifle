import { NextResponse } from "next/server";
import { revalidatePath, updateTag } from "next/cache";

/**
 * Admin-only manual cache invalidator. Manuel script'le DB'yi degistirdikten
 * sonra (servar action akisi disinda) Next.js unstable_cache wrapper'lari
 * stale veri serve eder; bu endpoint targeted invalidation imkani verir.
 *
 * **Auth:** Authorization: Bearer $ADMIN_REVALIDATE_SECRET
 *
 * **Params:**
 *   - ?path=/tarif/<slug>  → o spesifik path'i revalidate
 *   - ?tag=recipes         → tag bazinda invalidate (tum 'recipes' cache'leri)
 *   - ?slug=<slug>         → kisayol: /tarif/<slug> + /api/recipes/<slug>
 *                            ikisini birden + 'recipes' tag invalidate
 *
 * **Usage:**
 *   curl -H "Authorization: Bearer $SECRET" \
 *     "https://tarifle.app/api/admin/revalidate?slug=enginarli-domatesli-pide-manisa-usulu"
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.ADMIN_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_REVALIDATE_SECRET is not configured" },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pathParam = url.searchParams.get("path");
  const tagParam = url.searchParams.get("tag");
  const slugParam = url.searchParams.get("slug");

  const actions: string[] = [];

  if (slugParam) {
    revalidatePath(`/tarif/${slugParam}`);
    updateTag("recipes");
    actions.push(`path:/tarif/${slugParam}`, `tag:recipes`);
  }
  if (pathParam) {
    revalidatePath(pathParam);
    actions.push(`path:${pathParam}`);
  }
  if (tagParam) {
    updateTag(tagParam);
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
