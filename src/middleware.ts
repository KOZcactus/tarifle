import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: minimal A/B deney cookie atama.
 *
 * Hero tagline A/B testi icin `hero_variant` cookie'si yoksa rastgele
 * A veya B ataniyor. Pozisyonlama testi: mevcut "Bugun ne pisirsek?"
 * (A) + GPT onerisi "Evde ne varsa, surene ve hassasiyetlerine gore..."
 * (B). Cookie sticky (90 gun), kullanici sonraki ziyaretlerinde ayni
 * varyant'i gorur; telemetry bozulmaz.
 *
 * Kapsam: sadece GET / (home page). Diger route'lar etkilenmez. API,
 * _next, statik varlik match'i dis'landi ki middleware overhead hot
 * path'de yok.
 *
 * Neden middleware: server component `cookies()` read-only; yazim
 * middleware, route handler veya server action'da. Ana sayfanin
 * ilk render'inda variant hazir olmali, yuzden middleware ile on
 * hazirlik yapilip page'te okunuyor.
 *
 * Random bias: ~50/50 (Math.random < 0.5). Sample boyutu kucuk iken
 * sapma normal; birkac ay icinde cookie dagilimi Sentry breadcrumb
 * uzerinden gozlenir + karar verilir.
 */

const COOKIE = "hero_variant";
const VARIANTS = ["A", "B"] as const;
const MAX_AGE = 90 * 24 * 60 * 60; // 90 gun

export function middleware(request: NextRequest) {
  // Sadece `/` root icin variant cookie assign; diger path'ler bypass.
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const existing = request.cookies.get(COOKIE);
  if (existing && (VARIANTS as readonly string[]).includes(existing.value)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const variant = Math.random() < 0.5 ? "A" : "B";
  response.cookies.set(COOKIE, variant, {
    maxAge: MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false, // client de breadcrumb icin okur
  });
  return response;
}

export const config = {
  // API, _next, static assets disinda calis. Home page en kritik target;
  // middleware her / request'te once calisir, cookie yoksa set eder.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap-.*\\.xml|icon-.*\\.png|apple-touch-icon.png|feed.xml|llms.txt).*)",
  ],
};
