"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadRecipePhoto,
  deleteRecipePhoto as cloudinaryDelete,
} from "@/lib/cloudinary";
import {
  SITE_SETTING_KEYS,
  isUserPhotosEnabled,
  setSiteSetting,
} from "@/lib/site-settings";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";

/**
 * Recipe photo actions, user upload + owner/admin delete + admin hide.
 *
 * Feature flag gate: `isUserPhotosEnabled()` → site-settings store.
 * Upload action short-circuits when flag false (UI already hides the form,
 * ama agresif defense, doğrudan FormData POST edenlere karşı).
 *
 * Rate-limit: upload action `upload:photo:<userId>` bucket, ratelimit.ts
 * review pattern'ine benzer; spam kendi başına engellensin.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CAPTION = 200;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export interface PhotoActionResult {
  success: boolean;
  error?: string;
  photoId?: string;
}

/**
 * Upload a photo for a recipe. Called from `UserPhotoUpload` client
 * component with multipart FormData.
 *
 * Pipeline:
 *   1. Auth gate (login + email verified + not suspended).
 *   2. Feature flag gate.
 *   3. Rate limit bucket.
 *   4. Validate file (type + size + presence of recipe).
 *   5. Stream to Cloudinary → get secure URL + thumbnail URL + publicId.
 *   6. Insert RecipePhoto row with status=VISIBLE.
 *   7. revalidatePath tarif detay → grid tazelensin.
 */
export async function uploadRecipePhotoAction(
  formData: FormData,
): Promise<PhotoActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "auth-required" };
  }

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      emailVerified: true,
      suspendedAt: true,
    },
  });
  if (!userRow) return { success: false, error: "user-not-found" };
  if (userRow.suspendedAt) return { success: false, error: "account-suspended" };
  if (!userRow.emailVerified) return { success: false, error: "email-not-verified" };

  if (!(await isUserPhotosEnabled())) {
    return { success: false, error: "feature-disabled" };
  }

  const limit = await checkRateLimit(
    "recipePhotoUpload",
    rateLimitIdentifier(session.user.id),
  );
  if (!limit.success) {
    return { success: false, error: "rate-limited" };
  }

  const recipeId = String(formData.get("recipeId") ?? "");
  const file = formData.get("photo");
  const captionRaw = formData.get("caption");

  if (!recipeId) return { success: false, error: "recipe-required" };
  if (!(file instanceof File)) return { success: false, error: "file-required" };
  if (file.size === 0) return { success: false, error: "file-empty" };
  if (file.size > MAX_BYTES) return { success: false, error: "file-too-large" };
  if (!ALLOWED_MIME.has(file.type)) return { success: false, error: "file-type-unsupported" };

  const caption =
    typeof captionRaw === "string"
      ? captionRaw.trim().slice(0, MAX_CAPTION) || null
      : null;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, slug: true },
  });
  if (!recipe) return { success: false, error: "recipe-not-found" };

  const buffer = Buffer.from(await file.arrayBuffer());

  let uploaded;
  try {
    uploaded = await uploadRecipePhoto(buffer, recipe.slug);
  } catch (err) {
    console.error("[recipe-photo] Cloudinary upload failed:", err);
    return { success: false, error: "upload-failed" };
  }

  const row = await prisma.recipePhoto.create({
    data: {
      recipeId: recipe.id,
      userId: session.user.id,
      imageUrl: uploaded.secureUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      caption,
      status: "VISIBLE",
    },
    select: { id: true },
  });

  revalidatePath(`/tarif/${recipe.slug}`);
  revalidatePath("/admin/topluluk-fotolari");

  return { success: true, photoId: row.id };
}

/**
 * Delete a photo. Allowed by:
 *   - the owner (userId === session.user.id)
 *   - ADMIN / MODERATOR role
 *
 * Removes Cloudinary asset too (saves storage + complies with GDPR-style
 * deletion, Tarifle doesn't need to keep proof of deleted user content).
 */
export async function deleteRecipePhotoAction(
  photoId: string,
): Promise<PhotoActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const photo = await prisma.recipePhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      userId: true,
      publicId: true,
      recipe: { select: { slug: true } },
    },
  });
  if (!photo) return { success: false, error: "not-found" };

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const isAdmin = userRow?.role === "ADMIN" || userRow?.role === "MODERATOR";
  const isOwner = photo.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return { success: false, error: "forbidden" };
  }

  await prisma.recipePhoto.delete({ where: { id: photoId } });
  try {
    await cloudinaryDelete(photo.publicId);
  } catch (err) {
    // DB kaydı düştü; Cloudinary temizliği best-effort, başarısızsa
    // loglayıp düşürelim, admin panelinden "orphan cleanup" ayrı iş.
    console.error("[recipe-photo] Cloudinary destroy failed:", err);
  }

  revalidatePath(`/tarif/${photo.recipe.slug}`);
  revalidatePath("/admin/topluluk-fotolari");
  return { success: true };
}

/**
 * Admin-only: VISIBLE → HIDDEN toggle (veya tersi). Hard delete yerine
 * yumuşak gizleme, kullanıcı itiraz ederse geri açılabilir. Cloudinary
 * asset korunur.
 */
export async function toggleRecipePhotoVisibilityAction(
  photoId: string,
): Promise<PhotoActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (userRow?.role !== "ADMIN" && userRow?.role !== "MODERATOR") {
    return { success: false, error: "forbidden" };
  }

  const photo = await prisma.recipePhoto.findUnique({
    where: { id: photoId },
    select: { status: true, recipe: { select: { slug: true } } },
  });
  if (!photo) return { success: false, error: "not-found" };

  const nextStatus = photo.status === "VISIBLE" ? "HIDDEN" : "VISIBLE";
  await prisma.recipePhoto.update({
    where: { id: photoId },
    data: { status: nextStatus },
  });

  revalidatePath(`/tarif/${photo.recipe.slug}`);
  revalidatePath("/admin/topluluk-fotolari");
  return { success: true };
}

/**
 * Admin-only: tüm sitedeki user-photos feature flag'ini aç/kapat. Kapalıyken
 * upload form'u UI'dan gizlenir + server action feature-disabled döner +
 * tarif detay grid'i render etmez. Mevcut fotoğraflar silinmez; flag
 * tekrar açıldığında olduğu gibi görünür.
 */
export async function toggleUserPhotosFeatureAction(
  value: boolean,
): Promise<PhotoActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "auth-required" };

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (userRow?.role !== "ADMIN" && userRow?.role !== "MODERATOR") {
    return { success: false, error: "forbidden" };
  }

  await setSiteSetting(
    SITE_SETTING_KEYS.USER_PHOTOS_ENABLED,
    value ? "true" : "false",
    session.user.id,
  );

  revalidatePath("/admin/topluluk-fotolari");
  // SiteSetting okuma `unstable_cache` 60s TTL, toggle sonrası tarif
  // detay sayfalarında en geç 60s içinde yeni değer görünür. Admin
  // feedback için admin path açık invalidate edildi.

  return { success: true };
}
