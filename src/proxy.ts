import { NextResponse, type NextRequest } from "next/server";

/**
 * Tek iş: IndexNow key doğrulama dosyasını serve etmek.
 *
 * Bing/Yandex/Seznam IndexNow protokolü site kökünde `/{key}.txt`
 * erişilebilir ister; içerik aynı key (plaintext). Static `public/*.txt`
 * koymak yerine env'den okuyarak rotate kolay oluyor, Vercel env
 * update + redeploy yeterli, dosya rename yok.
 *
 * Matcher `.txt` sonlu path'leri yakalar; başka her şey pass.
 * `next.config` rewrites Edge Function limit problemine girmez çünkü
 * Prisma/ağır bağımlılık yüklenmiyor, saf string match + NextResponse.
 */
export function proxy(req: NextRequest): NextResponse {
  const path = req.nextUrl.pathname;
  const match = path.match(/^\/([a-zA-Z0-9-]{8,128})\.txt$/);
  if (!match) return NextResponse.next();

  const requested = match[1];
  const expected = process.env.INDEXNOW_KEY;

  // Env set değilse veya eşleşmiyorsa 404, app route'larına düşsün.
  // (static llms.txt / robots.txt farklı path, bu matcher yakalamaz çünkü
  //  kısa key regex'i 8+ karakter; `llms`/`robots` 5-6 karakter.)
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

export const config = {
  // Sadece kök seviye .txt URL'lerini yakala (api, _next, static asset
  // path'leri hariç). Proxy body zaten regex ile key kısıtı yapıyor,
  // eşleşmezse NextResponse.next() ile app route'una düşer (llms.txt,
  // robots.txt etkilenmez).
  matcher: ["/((?!api|_next|_static|favicon.ico).*\\.txt)"],
};
