import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (eski middleware). Iki gorevi var:
 *
 * 1. **IndexNow key dosyasi**: Bing/Yandex/Seznam IndexNow protokolu
 *    site kokunde `/{key}.txt` erisilebilir ister; icerik ayni key
 *    (plaintext). Env'den okuyarak rotate kolay, dosya rename yok.
 *
 * 2. **Hero A/B cookie atama**: `/` root ziyaretinde `hero_variant`
 *    cookie'si yoksa rastgele A/B atanir (docs/TARIFLE_ULTIMATE_PLAN
 *    §35 positioning test). Cookie 90 gun sticky, kullanici ayni
 *    variant'i gorur; telemetry Sentry tag ile dashboard'da filtrele
 *    nebilir.
 *
 * Next 16 breaking change: `middleware.ts` -> `proxy.ts`, `middleware`
 * export'u -> `proxy` export'u. Tek proxy fonksiyonu iki gorevi sira
 * ile degerlendirir; path'e gore dallanir, diger case'lere pass
 * (NextResponse.next).
 */

const COOKIE = "hero_variant";
const VARIANTS = ["A", "B"] as const;
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 gun

export function proxy(req: NextRequest): NextResponse {
  const path = req.nextUrl.pathname;

  // Case 1: IndexNow key .txt dosyasi
  const txtMatch = path.match(/^\/([a-zA-Z0-9-]{8,128})\.txt$/);
  if (txtMatch) {
    const requested = txtMatch[1];
    const expected = process.env.INDEXNOW_KEY;

    // Env set degilse veya eslesmiyorsa 404, app route'larina dussun.
    // (static llms.txt / robots.txt farkli path, regex 8+ karakter ile
    //  korunur; llms/robots 5-6 karakter, yakalanmaz.)
    if (!expected || requested !== expected) {
      return NextResponse.next();
    }

    return new NextResponse(expected, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  }

  // Case 2: Hero A/B cookie (sadece "/" root)
  if (path === "/") {
    const existing = req.cookies.get(COOKIE);
    if (existing && (VARIANTS as readonly string[]).includes(existing.value)) {
      return NextResponse.next();
    }

    const response = NextResponse.next();
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set(COOKIE, variant, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // client breadcrumb icin okur
    });
    return response;
  }

  // Diger path'ler: pass-through
  return NextResponse.next();
}

export const config = {
  // API, _next, statik varliklar disinda her yol proxy'ye uger. Body
  // regex + path kontrolu ile hangi case'e dustugunu secer.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap-.*\\.xml|icon-.*\\.png|apple-touch-icon.png|feed.xml|llms.txt).*)",
  ],
};
