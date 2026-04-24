"use server";

/**
 * User pantry preferences. /ayarlar Dolap bolumu kullanir.
 *
 * Toggle:
 *   - pantryExpiryTracking → /dolap'ta son kullanma tarihi input + yaklasan
 *                            SKT uyari banner'i gorunur. Default kapali,
 *                            kullanici opt-in yapar.
 *
 * Kapaliyken dolap UI'si sadelesir: sadece miktar + birim input'u kalir.
 * SKT alanlari DB'de saklanir (kullanici yine veri kaybetmez), sadece
 * UI'da gizlenir. Sonradan toggle acilirsa eski SKT verileri tekrar
 * gorunur.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const pantryPrefsSchema = z.object({
  pantryExpiryTracking: z.boolean(),
});

export type PantryPrefsInput = z.infer<typeof pantryPrefsSchema>;

export interface PantryPrefsActionResult {
  success: boolean;
  error?: string;
}

export async function updatePantryPreferencesAction(
  input: PantryPrefsInput,
): Promise<PantryPrefsActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = pantryPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "invalid input",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pantryExpiryTracking: parsed.data.pantryExpiryTracking },
  });

  revalidatePath("/ayarlar");
  revalidatePath("/dolap");
  return { success: true };
}

export async function getUserPantryPreferences(userId: string): Promise<{
  pantryExpiryTracking: boolean;
}> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { pantryExpiryTracking: true },
  });
  return { pantryExpiryTracking: row?.pantryExpiryTracking ?? false };
}
