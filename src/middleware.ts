import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth kontrolu sayfa seviyesinde yapiliyor (server component'larda auth() ile).
// Middleware sadece genel routing icin kullanilir.
// Prisma Client edge runtime'da cok buyuk oldugu icin middleware'de auth() kullanmiyoruz.

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
