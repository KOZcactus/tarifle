"use server";

/**
 * User diet profile preference (oturum 20, DIET_SCORE_PLAN.md).
 *
 * Iki ayri action:
 *   - setDietProfileAction(slug | null) -> /ayarlar/diyet'te preset secimi
 *   - setShowDietBadgeAction(boolean)   -> /ayarlar/gizlilik altinda toggle
 *
 * Slug "" veya null gonderilirse profil temizlenir (badge gozukmez).
 * Slug bilinmiyorsa validation error.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAvailableDietSlugs } from "@/lib/diet-scoring/profiles";

const dietProfileSchema = z
  .string()
  .nullable()
  .refine(
    (v) => v === null || v === "" || listAvailableDietSlugs().includes(v),
    "unknown diet slug",
  );

const showDietBadgeSchema = z.boolean();

export interface DietProfileActionResult {
  success: boolean;
  error?: string;
}

export async function setDietProfileAction(
  slug: string | null,
): Promise<DietProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "unauthorized" };

  const parsed = dietProfileSchema.safeParse(slug);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "invalid input" };
  }

  const normalized = parsed.data === "" ? null : parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { dietProfile: normalized },
  });

  revalidatePath("/ayarlar");
  // Ana sayfa, /tarifler ve listing sayfalari user.dietProfile'a bagli
  // badge render ediyor; cache invalidate.
  revalidatePath("/");
  revalidatePath("/tarifler");

  return { success: true };
}

export async function setShowDietBadgeAction(
  show: boolean,
): Promise<DietProfileActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "unauthorized" };

  const parsed = showDietBadgeSchema.safeParse(show);
  if (!parsed.success) {
    return { success: false, error: "invalid input" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { showDietBadge: parsed.data },
  });

  revalidatePath("/ayarlar");
  revalidatePath("/");
  revalidatePath("/tarifler");

  return { success: true };
}
