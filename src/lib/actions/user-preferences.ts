"use server";

/**
 * User personalisation preferences — MVP round saves the three selection
 * sets (favoriteTags / allergenAvoidances / favoriteCuisines) to the
 * `users` table. Listing/discover filtering is a separate pass; this
 * server action only persists.
 *
 * Zod schema restricts inputs to canonical enums/slug lists so arbitrary
 * strings can't land in the DB. Tag slug validation is deferred to DB
 * lookup (cheap) — we only check string shape up front.
 */
import { z } from "zod";
import type { Allergen } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { CUISINE_CODES, type CuisineCode } from "@/lib/cuisines";
import { ALLERGEN_ORDER } from "@/lib/allergens";
import { prisma } from "@/lib/prisma";

const TAG_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;

const preferencesSchema = z.object({
  favoriteTags: z
    .array(z.string().regex(TAG_SLUG_RE, "invalid tag slug"))
    .max(20),
  allergenAvoidances: z
    .array(z.enum(ALLERGEN_ORDER as readonly [Allergen, ...Allergen[]]))
    .max(10),
  favoriteCuisines: z
    .array(z.enum(CUISINE_CODES as readonly [CuisineCode, ...CuisineCode[]]))
    .max(24),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;

export interface PreferencesActionResult {
  success: boolean;
  error?: string;
}

export async function updateUserPreferencesAction(
  input: PreferencesInput,
): Promise<PreferencesActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "invalid input",
    };
  }

  // Validate tag slugs exist — prevents UI-chipset drift from persisting
  // orphan slugs. Dedupe via Set so repeated values don't double-count.
  const uniqueTagSlugs = Array.from(new Set(parsed.data.favoriteTags));
  if (uniqueTagSlugs.length > 0) {
    const existing = await prisma.tag.findMany({
      where: { slug: { in: uniqueTagSlugs } },
      select: { slug: true },
    });
    const valid = new Set(existing.map((t) => t.slug));
    const unknown = uniqueTagSlugs.filter((s) => !valid.has(s));
    if (unknown.length > 0) {
      return { success: false, error: `unknown tag: ${unknown[0]}` };
    }
  }

  const uniqueAllergens = Array.from(new Set(parsed.data.allergenAvoidances));
  const uniqueCuisines = Array.from(new Set(parsed.data.favoriteCuisines));

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      favoriteTags: uniqueTagSlugs,
      allergenAvoidances: uniqueAllergens,
      favoriteCuisines: uniqueCuisines,
    },
  });

  revalidatePath("/ayarlar");
  return { success: true };
}

/** Server helper for the /ayarlar page to hydrate the card's initial state. */
export async function getUserPreferences(userId: string): Promise<{
  favoriteTags: string[];
  allergenAvoidances: Allergen[];
  favoriteCuisines: string[];
}> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      favoriteTags: true,
      allergenAvoidances: true,
      favoriteCuisines: true,
    },
  });
  if (!row) {
    return { favoriteTags: [], allergenAvoidances: [], favoriteCuisines: [] };
  }
  return row;
}

