"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";
import { sendVerificationEmail } from "@/lib/email/verification";
import {
  checkRateLimit,
  getClientIp,
  rateLimitIdentifier,
} from "@/lib/rate-limit";

interface RegisterResult {
  success: boolean;
  error?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  // Rate limit by IP — an unauthenticated form, so user id is not available.
  // 3 registrations / 10 minutes per IP stops obvious account-farming without
  // hurting legit users (family sharing one household IP is well under the cap).
  const ip = await getClientIp();
  const rate = await checkRateLimit("register", rateLimitIdentifier(null, ip));
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const rawEmail = (formData.get("email") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const kvkkAccepted = formData.get("kvkkAccepted") === "on";

  if (!name || !rawEmail || !password) {
    return { success: false, error: "Tüm alanlar zorunludur." };
  }

  if (name.length < 2 || name.length > 100) {
    return { success: false, error: "Ad 2–100 karakter olmalıdır." };
  }

  if (password.length < 6) {
    return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
  }

  if (!kvkkAccepted) {
    return { success: false, error: "KVKK aydınlatma metnini kabul etmelisiniz." };
  }

  const email = normalizeEmail(rawEmail);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "Bu e-posta adresi zaten kayıtlı." };
  }

  const baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  const uniqueSuffix = Math.random().toString(36).slice(2, 7);
  const username = `${baseUsername}${uniqueSuffix}`;

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      username,
      passwordHash,
      kvkkAccepted: true,
      kvkkVersion: "1.0",
      kvkkDate: new Date(),
    },
  });

  // Fire-and-forget verification email — don't block sign-in if SMTP is down.
  // The user can resend from their profile if the first attempt fails.
  sendVerificationEmail(email, name).catch((err) => {
    console.error("[register] verification email failed:", err);
  });

  // Sign-in happens client-side after this action returns. Calling signIn here
  // (with redirectTo) would throw NEXT_REDIRECT inside the server action and
  // skip the cookie-refresh step that the SessionProvider needs — the client
  // ends up on "/" but `useSession()` still reports logged-out until a hard
  // reload. Client-side signIn + router.refresh() mirrors the login flow and
  // avoids that stale-session window.
  return { success: true };
}

/**
 * Server action: re-issue a verification email for the currently signed-in user.
 * Rate limited to 1 resend per 60 seconds per user via Upstash Redis — this
 * replaces the previous in-process Map throttle which didn't survive across
 * Vercel cold starts or multiple regions.
 */
export async function resendVerificationEmailAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısın." };
  }

  const rate = await checkRateLimit(
    "resend-verification",
    rateLimitIdentifier(session.user.id),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok hızlı denedin." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, emailVerified: true },
  });
  if (!user) return { success: false, error: "Kullanıcı bulunamadı." };
  if (user.emailVerified) {
    return { success: false, error: "E-postan zaten doğrulanmış." };
  }

  const result = await sendVerificationEmail(user.email, user.name);
  if (!result.success) {
    return { success: false, error: result.error ?? "Mail gönderilemedi." };
  }
  return { success: true };
}
