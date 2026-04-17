import NextAuth from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";
import { LINK_INTENT_COOKIE, verifyLinkIntent } from "@/lib/link-intent";

/**
 * Our Prisma `User.username` column is required + unique, but Auth.js's
 * PrismaAdapter doesn't know about it and passes a bare `{ name, email, ... }`
 * to `prisma.user.create` — Prisma rejects with "Argument username is missing".
 *
 * We wrap PrismaAdapter and override `createUser` so first-time OAuth sign-in
 * mints a unique username + fills in our KVKK timestamps alongside the
 * Auth.js-provided fields. Everything else (getUser, linkAccount, session
 * persistence, ...) still flows through the real adapter.
 */
function buildAdapter(): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async createUser(user) {
      const baseUsername = (user.name || "kullanici")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);
      const uniqueSuffix = Math.random().toString(36).slice(2, 7);
      const username = `${baseUsername || "kullanici"}${uniqueSuffix}`;

      const created = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          // Our schema stores the profile picture in `avatarUrl`; Auth.js
          // calls it `image`. Map the incoming field onto our column.
          avatarUrl: user.image ?? null,
          // Google IDs the user via an id_token that Google has already
          // verified, so we trust the address as verified without our own loop.
          emailVerified: user.emailVerified ?? new Date(),
          username,
          kvkkAccepted: true,
          kvkkVersion: "1.0",
          kvkkDate: new Date(),
        },
      });

      // Re-shape for Auth.js: AdapterUser expects `image`, not `avatarUrl`.
      return {
        id: created.id,
        name: created.name,
        email: created.email,
        emailVerified: created.emailVerified,
        image: created.avatarUrl,
      } as AdapterUser;
    },
  };
}

/**
 * Pull a best-effort client IP out of a standard `Request` object. Auth.js
 * hands us the original request inside `authorize`, which is our only hook
 * here — we can't use `next/headers` because the credentials provider may
 * run outside a Next request context (e.g. during OAuth flows that also hit
 * this file).
 */
function ipFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: buildAdapter(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/giris",
    error: "/giris",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Flag says "auto-link OAuth sign-ins to existing-email users". That
      // default behaviour is dangerous. We keep the actual gate inside the
      // `signIn` callback below: linking is only allowed when the user has
      // just clicked "Google hesabını bağla" from /ayarlar (signed link-
      // intent cookie). Plain OAuth sign-ins where an email match exists
      // without that cookie are rejected the same as before.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // 5 attempts per minute per IP — matches common "login is brute-forceable"
        // guidance. Fails open when UPSTASH creds aren't configured, so local
        // dev stays smooth. We do NOT throw — returning null surfaces the
        // existing "e-posta veya şifre hatalı" message without leaking the
        // distinction between bad creds and rate limited.
        const ip = ipFromRequest(request);
        if (ip) {
          const rate = await checkRateLimit("login", rateLimitIdentifier(null, ip));
          if (!rate.success) return null;
        }

        const email = normalizeEmail(credentials.email as string);
        const password = credentials.password as string;

        // Explicit select — default findUnique tüm kolonları çeker, gelecekte
        // başka schema mismatch senaryolarına karşı explicit liste daha
        // dayanıklı. Suspension kontrolü dahil.
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            avatarUrl: true,
            suspendedAt: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        // Suspended accounts can't sign in. We intentionally fall through
        // to the generic "e-posta veya şifre hatalı" flow rather than
        // leaking suspension state to an attacker — honest users see the
        // suspendedAt flag on /ayarlar page after next valid login attempt,
        // or in-product support. (Future work: dedicated "hesabın askıda"
        // screen with suspendedReason.)
        if (user.suspendedAt) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
            suspendedAt: true,
          },
        });
        if (dbUser) {
          // Defensive: a session could be reissued mid-suspension (ör. admin
          // 1 saat sonra askıya aldı, token hâlâ geçerli). Return null ile
          // token'ı iptal edelim — client bir sonraki middleware geçişinde
          // sign-in'e yönlendirilir.
          if (dbUser.suspendedAt) return null;
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
          token.picture = dbUser.avatarUrl;
        }
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.username = session.username;
        token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
    /**
     * Gate OAuth sign-ins against the danger of auto-linking a Google
     * account to a pre-existing credentials user purely by email match.
     *
     * Decision tree for Google OAuth:
     *  - Linking flow (user clicked "bağla" on /ayarlar): signed cookie is
     *    present; email from Google must match the cookie's user email.
     *    Allow → adapter creates the Account row.
     *  - Normal sign-in, new email: no existing user, adapter creates both
     *    User and Account. Allow.
     *  - Normal sign-in, email already belongs to a user who already has a
     *    Google account linked: same user signing back in. Allow.
     *  - Normal sign-in, email already belongs to a user with NO Google
     *    account yet: reject. Would be silent takeover otherwise. Pipe the
     *    error code Auth.js uses so /giris renders the friendly message.
     *
     * Credentials sign-ins always pass through (this branch only fires
     * when the provider is google).
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;
      const googleEmail = normalizeEmail(user.email);

      const cookieStore = await cookies();
      const intentCookie = cookieStore.get(LINK_INTENT_COOKIE)?.value;
      const intentUserId = verifyLinkIntent(intentCookie);

      if (intentUserId) {
        // Explicit linking flow — verify the user that started it and
        // that the Google email matches their account email.
        const intentUser = await prisma.user.findUnique({
          where: { id: intentUserId },
          select: { id: true, email: true },
        });
        if (!intentUser) return "/ayarlar?linkError=session";
        if (normalizeEmail(intentUser.email) !== googleEmail) {
          return "/ayarlar?linkError=mismatch";
        }
        // Let the adapter create the Account row. Cookie is consumed on a
        // successful link by the /api/link/google/start route on its next
        // call (it overwrites) — and we also clear it lazily here by
        // returning true; the browser keeps it until TTL expires otherwise,
        // which is fine because verifyLinkIntent also time-bounds it.
        return true;
      }

      // No linking intent — fall back to safe default: reject any sign-in
      // that would silently link a Google account to an existing local user.
      const existing = await prisma.user.findUnique({
        where: { email: googleEmail },
        select: {
          id: true,
          accounts: {
            where: { provider: "google" },
            select: { id: true },
          },
        },
      });
      if (existing && existing.accounts.length === 0) {
        // Auth.js renders the query string's `error` via our /giris page.
        return "/giris?error=OAuthAccountNotLinked";
      }

      return true;
    },
  },
});
