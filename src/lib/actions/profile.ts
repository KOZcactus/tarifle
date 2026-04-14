"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";
import {
  passwordChangeSchema,
  passwordSetSchema,
  profileUpdateSchema,
} from "@/lib/validators";

interface UpdateProfileResult {
  success: boolean;
  error?: string;
  /**
   * Fields the caller should push into `useSession().update(...)` so the
   * JWT token picks up the new name/username/image without a sign-out. The
   * session callback in lib/auth.ts forwards these into the token on the
   * "update" trigger.
   */
  data?: {
    name: string;
    username: string;
    image: string | null;
  };
  /** Previous username, so the caller can redirect /profil/<old> → <new>. */
  previousUsername?: string;
}

/**
 * Update the signed-in user's profile (name, username, bio). Username
 * changes are allowed but must clear the reserved-list + uniqueness check;
 * the DB has a unique index so a race between two users picking the same
 * handle surfaces as P2002 and we translate that into a friendly message.
 *
 * Does NOT update email (that flow needs re-verification) or password
 * (separate dedicated action once password-change UI lands).
 */
export async function updateProfileAction(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısın." };
  }

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    bio: (formData.get("bio") as string | null) ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Bilgiler geçersiz.",
    };
  }

  const { name, username, bio } = parsed.data;
  const userId = session.user.id;

  // Fetch current values — we need the old username for redirect + cache
  // invalidation.
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, avatarUrl: true },
  });
  if (!current) return { success: false, error: "Kullanıcı bulunamadı." };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        bio: bio ?? null,
      },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return {
        success: false,
        error: "Bu kullanıcı adı zaten alınmış, başka birini dene.",
      };
    }
    throw err;
  }

  // Invalidate both the old and new profile URLs so neither shows stale copy.
  revalidatePath(`/profil/${current.username}`);
  if (current.username !== username) {
    revalidatePath(`/profil/${username}`);
  }

  return {
    success: true,
    data: {
      name,
      username,
      image: current.avatarUrl,
    },
    previousUsername: current.username,
  };
}

interface PasswordChangeResult {
  success: boolean;
  error?: string;
}

/**
 * Change the current user's password. Requires the current password — that's
 * the single most important safety gate, because a stolen session cookie
 * without the password is useless here.
 *
 * OAuth-only users (registered with Google, no `passwordHash`) get told to
 * set a password elsewhere — we don't quietly let them "set" a first
 * password via this flow, because that would be a different risk profile
 * (setting vs. rotating).
 */
export async function changePasswordAction(
  formData: FormData,
): Promise<PasswordChangeResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısın." };
  }

  // Rate-limit — brute-force guard on the "currentPassword" check.
  const rate = await checkRateLimit(
    "password-change",
    rateLimitIdentifier(session.user.id),
  );
  if (!rate.success) {
    return {
      success: false,
      error: rate.message ?? "Çok fazla deneme. Biraz sonra tekrar dene.",
    };
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz giriş.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { success: false, error: "Kullanıcı bulunamadı." };
  if (!user.passwordHash) {
    return {
      success: false,
      error:
        "Şifren yok — hesabını Google gibi bir sağlayıcı ile açmışsın. Şifre eklemek için destek ekibiyle iletişime geç.",
    };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return { success: false, error: "Mevcut şifren yanlış." };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

/**
 * First-time password for OAuth-only users (signed up with Google, no
 * passwordHash yet). After this runs the user can sign in with either
 * Google OR credentials.
 *
 * Safety gates:
 *  1. Session must exist — standard auth check.
 *  2. User must NOT already have a passwordHash. If they do, we redirect
 *     them to the normal change flow (which requires the current password).
 *     Without this, a stolen session cookie could silently rotate someone's
 *     password here and bypass the change endpoint's bcrypt.compare.
 *  3. Rate limit shared with the change flow — same brute-force pressure.
 */
export async function setPasswordAction(
  formData: FormData,
): Promise<PasswordChangeResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısın." };
  }

  const rate = await checkRateLimit(
    "password-change",
    rateLimitIdentifier(session.user.id),
  );
  if (!rate.success) {
    return {
      success: false,
      error: rate.message ?? "Çok fazla deneme. Biraz sonra tekrar dene.",
    };
  }

  const parsed = passwordSetSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz giriş.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { success: false, error: "Kullanıcı bulunamadı." };

  if (user.passwordHash) {
    return {
      success: false,
      error:
        "Şifren zaten var — değiştirmek için mevcut şifreni gerektiren formu kullan.",
    };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

