import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LINK_INTENT_COOKIE, signLinkIntent } from "@/lib/link-intent";

/**
 * Step 1 of the "link my Google account" flow: sets the signed link-intent
 * cookie the `signIn` callback in lib/auth.ts keys off.
 *
 * Deliberately does NOT redirect to Google. A server-side 303 to
 * /api/auth/signin/google would land on Auth.js's sign-in UI because that
 * endpoint only redirects out-of-origin on CSRF-stamped POSTs. Step 2
 * (the client calling `signIn("google", ...)`) handles the real OAuth
 * handshake — CSRF token + provider redirect — from the browser.
 *
 * Only POST is accepted: this mutates state (sets a cookie).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Giriş yapmalısın." },
      { status: 401 },
    );
  }

  const intent = signLinkIntent(session.user.id);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LINK_INTENT_COOKIE, intent, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60, // keep in sync with link-intent.ts TTL
  });
  return response;
}
