"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validators";

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
