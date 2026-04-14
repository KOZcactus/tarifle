import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { LINK_INTENT_COOKIE, signLinkIntent } from "@/lib/link-intent";

/**
 * Starts the "link my Google account" flow for the currently signed-in user.
 *
 * Flow:
 *   1. Verify there's an authenticated session (can't link for a stranger).
 *   2. Set a signed, short-lived cookie containing the user id. The `signIn`
 *      callback in auth.ts reads this cookie and only allows the OAuth
 *      linking path when it's valid + the Google email matches.
 *   3. 302 to the standard Auth.js sign-in endpoint with `callbackUrl` back
 *      to /ayarlar so the user lands where they started.
 *
 * Only POST is accepted — this endpoint mutates state (sets a cookie) so
 * CSRF-safe methods would be wrong here. The frontend uses a form POST.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/giris?callbackUrl=/ayarlar", request.url),
    );
  }

  const intent = signLinkIntent(session.user.id);

  // Point Auth.js at the public sign-in route; callbackUrl takes the user
  // back to /ayarlar with a success flag so the page can render "bağlandı".
  const target = new URL("/api/auth/signin/google", request.url);
  target.searchParams.set("callbackUrl", "/ayarlar?linked=1");

  const response = NextResponse.redirect(target, { status: 303 });
  response.cookies.set(LINK_INTENT_COOKIE, intent, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60, // keep in sync with link-intent.ts TTL
  });
  return response;
}
