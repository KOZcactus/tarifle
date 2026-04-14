import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";

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
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/giris",
    error: "/giris",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Do NOT auto-link accounts across providers by email — prevents takeover
      // if an attacker controls an email that matches an existing local account.
      allowDangerousEmailAccountLinking: false,
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

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

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
          select: { id: true, username: true, role: true, avatarUrl: true },
        });
        if (dbUser) {
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
    // NOTE: no custom user-creation in signIn. Creating the User manually
    // here leaves the Account table empty for the OAuth provider, which then
    // trips PrismaAdapter's existing-email check and throws
    // OAuthAccountNotLinked. Let the adapter create User + Account atomically
    // and populate our app-specific fields in `events.createUser` below.
  },
  events: {
    // Fires once, right after PrismaAdapter has created a new User + Account
    // pair for an OAuth sign-in. Populates the fields the adapter doesn't
    // know about (username, KVKK timestamps). Credentials sign-up does its
    // own user creation in actions/auth.ts and never triggers this event.
    async createUser({ user }) {
      if (!user.id) return;
      const baseUsername = (user.name || "kullanici")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);
      const uniqueSuffix = Math.random().toString(36).slice(2, 7);
      const username = `${baseUsername || "kullanici"}${uniqueSuffix}`;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          // Google already verified the address before issuing the ID token,
          // so we trust it as verified without our own email loop.
          emailVerified: new Date(),
          kvkkAccepted: true,
          kvkkVersion: "1.0",
          kvkkDate: new Date(),
        },
      });
    },
  },
});
