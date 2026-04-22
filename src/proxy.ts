import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (eski middleware). Tek is: IndexNow key dosyasini
 * serve etmek.
 *
 * Bing/Yandex/Seznam IndexNow protokolu site kokunde `/{key}.txt`
 * erisilebilir ister; icerik ayni key (plaintext). Static `public/*.txt`
 * koymak yerine env'den okuyarak rotate kolay oluyor, Vercel env
 * update + redeploy yeterli, dosya rename yok.
 *
 * Matcher `.txt` sonlu path'leri yakalar; baska her sey pass.
 * `next.config` rewrites Edge Function limit problemine girmez cunku
 * Prisma/agir bagimliik yuklenmiyor, saf string match + NextResponse.
 *
 * Not (oturum 12): Onceki surumde burada hero A/B cookie atama logic'i
 * da vardi. Kerem karari ile iki hero ayni anda gosteriliyor (primary
 * + secondary), A/B cookie kaldirildi; saf IndexNow kaldi.
 */
export function proxy(req: NextRequest): NextResponse {
  const path = req.nextUrl.pathname;
  const match = path.match(/^\/([a-zA-Z0-9-]{8,128})\.txt$/);
  if (!match) return NextResponse.next();

  const requested = match[1];
  const expected = process.env.INDEXNOW_KEY;

  // Env set degilse veya eslesmiyorsa 404, app route'larina dussun.
  // (static llms.txt / robots.txt farkli path, bu matcher yakalamaz cunku
  //  kisa key regex'i 8+ karakter; `llms`/`robots` 5-6 karakter.)
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
  // Sadece kok seviye .txt URL'lerini yakala (api, _next, static asset
  // path'leri haric). Proxy body zaten regex ile key kisit yapiyor,
  // eslesmezse NextResponse.next() ile app route'una duser (llms.txt,
  // robots.txt etkilenmez).
  matcher: ["/((?!api|_next|_static|favicon.ico).*\\.txt)"],
};
