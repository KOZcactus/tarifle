"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";
import { sendVerificationEmail } from "@/lib/email/verification";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import {
  consumePasswordResetToken,
  sendOAuthOnlyPasswordResetEmail,
  sendPasswordResetEmail,
} from "@/lib/email/password-reset";
import {
  passwordResetRequestSchema,
  passwordResetSubmitSchema,
} from "@/lib/validators";
import {
  checkRateLimit,
  getClientIp,
  rateLimitIdentifier,
} from "@/lib/rate-limit";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "@/i18n/config";

/**
 * Reads NEXT_LOCALE cookie for requests where we don't yet have a User row
 * (register) or don't want to query the DB twice (resend). Falls back to TR.
 */
async function getLocaleFromCookie(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("NEXT_LOCALE")?.value;
  return isValidLocale(value) ? value : DEFAULT_LOCALE;
}

interface RegisterResult {
  success: boolean;
  error?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  // Rate limit by IP, an unauthenticated form, so user id is not available.
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

  // Fire-and-forget verification email, don't block sign-in if SMTP is down.
  // The user can resend from their profile if the first attempt fails. Locale
  // comes from the cookie because the User.locale column hasn't been set yet
  // (Prisma default will kick in on the row above, but reading it back would
  // require another query).
  const registerLocale = await getLocaleFromCookie();
  sendVerificationEmail(email, name, registerLocale).catch((err) => {
    console.error("[register] verification email failed:", err);
  });

  // Oturum 19 E paketi: Welcome email, kullaniciyi kesfe cagiriyor (Dolap,
  // AI Asistan, Favoriler/Koleksiyon). Verification email'den ayri, ikisi
  // birbirini tamamlar (verification dogrulamaya, welcome kesfe). Fire-
  // and-forget: SMTP hatası sign-in'i bloklamasin.
  sendWelcomeEmail(email, name, registerLocale).catch((err) => {
    console.error("[register] welcome email failed:", err);
  });

  // Sign-in happens client-side after this action returns. Calling signIn here
  // (with redirectTo) would throw NEXT_REDIRECT inside the server action and
  // skip the cookie-refresh step that the SessionProvider needs, the client
  // ends up on "/" but `useSession()` still reports logged-out until a hard
  // reload. Client-side signIn + router.refresh() mirrors the login flow and
  // avoids that stale-session window.
  return { success: true };
}

/**
 * Server action: re-issue a verification email for the currently signed-in user.
 * Rate limited to 1 resend per 60 seconds per user via Upstash Redis, this
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
    select: { email: true, name: true, emailVerified: true, locale: true },
  });
  if (!user) return { success: false, error: "Kullanıcı bulunamadı." };
  if (user.emailVerified) {
    return { success: false, error: "E-postan zaten doğrulanmış." };
  }

  const userLocale = isValidLocale(user.locale) ? user.locale : DEFAULT_LOCALE;
  const result = await sendVerificationEmail(user.email, user.name, userLocale);
  if (!result.success) {
    return { success: false, error: result.error ?? "Mail gönderilemedi." };
  }
  return { success: true };
}

/**
 * Step 1 of the "forgot password" flow. Always returns a generic success
 * message to the UI, never reveal whether an account exists for the given
 * email. This stops email-enumeration via the reset endpoint.
 *
 * Behaviour by account state (internal, never surfaced to UI):
 *   - user exists & has passwordHash     → send real reset link
 *   - user exists & passwordHash is null → send informational "use Google" mail
 *   - user does not exist                → do nothing (no DB row touched)
 *
 * Rate limiting uses the normalized email as the primary bucket so a single
 * attacker cannot exhaust the limit for every victim by cycling IPs, and
 * falls back to IP to stop a firehose of random emails from one source.
 */
export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    // Invalid shape is the only case we surface an error for, otherwise the
    // form just hangs. Missing email is a UI bug, not an enumeration vector.
    return { success: false, error: "Geçerli bir e-posta adresi girin." };
  }

  const email = normalizeEmail(parsed.data.email);
  const ip = await getClientIp();

  // Per-email bucket (primary, survives IP rotation) and per-IP bucket
  // (secondary, stops one IP from hammering through many victim emails).
  const byEmail = await checkRateLimit("password-reset-request", `email:${email}`);
  if (!byEmail.success) {
    return { success: false, error: byEmail.message ?? "Çok fazla istek." };
  }
  const byIp = await checkRateLimit(
    "password-reset-request",
    rateLimitIdentifier(null, ip),
  );
  if (!byIp.success) {
    return { success: false, error: byIp.message ?? "Çok fazla istek." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      passwordHash: true,
      deletedAt: true,
      locale: true,
    },
  });

  // Fire-and-forget: do not block the UI on SMTP. The "always-success" UI
  // already promises an indistinguishable response regardless of account
  // state, so swallowing send errors does not weaken that promise.
  if (user && !user.deletedAt) {
    const userLocale = isValidLocale(user.locale) ? user.locale : DEFAULT_LOCALE;
    if (user.passwordHash) {
      sendPasswordResetEmail(user.email, user.name, userLocale).catch((err) => {
        console.error("[password-reset] send failed:", err);
      });
    } else {
      sendOAuthOnlyPasswordResetEmail(user.email, user.name, userLocale).catch((err) => {
        console.error("[password-reset] oauth-only send failed:", err);
      });
    }
  }

  return { success: true };
}

/**
 * Step 2 of the "forgot password" flow. Consumes a reset token and sets a
 * new bcrypt'd password on the user row in one DB transaction. Every
 * outstanding reset token for the same email is wiped on success.
 *
 * Rate limit here is per-IP on token consumption, tokens are 32-byte random
 * (base64url) so guessing one is not practical, but the limiter slows down
 * anyone who starts spraying anyway.
 */
export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getClientIp();
  const rate = await checkRateLimit(
    "password-reset-consume",
    rateLimitIdentifier(null, ip),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = passwordResetSubmitSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Geçersiz istek.";
    return { success: false, error: first };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const result = await consumePasswordResetToken(parsed.data.token, passwordHash);

  if (!result.success) {
    if (result.reason === "expired") {
      return {
        success: false,
        error: "Bu sıfırlama bağlantısının süresi dolmuş. Yeni bir tane iste.",
      };
    }
    if (result.reason === "user-missing") {
      return {
        success: false,
        error: "Bu bağlantıya ait hesap bulunamadı.",
      };
    }
    return {
      success: false,
      error:
        "Bu sıfırlama bağlantısı geçersiz. Daha önce kullanılmış ya da hatalı olabilir.",
    };
  }

  return { success: true };
}
