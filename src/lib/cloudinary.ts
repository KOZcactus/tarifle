import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

/**
 * Cloudinary server-side client + helpers for user-uploaded recipe photos.
 *
 * Environment (`.env.local` / Vercel):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Credentials never touch the client — upload goes through a server action
 * (`uploadRecipePhotoAction`) that streams the file buffer to Cloudinary via
 * `uploader.upload_stream`. That keeps the API secret server-side and lets
 * us enforce auth + file validation before any bandwidth goes to Cloudinary.
 *
 * Folder: `tarifle/recipe-photos/<recipeSlug>`. Folder grouping keeps admin
 * audits clean and lets us purge per-recipe if ever needed.
 */

let initialized = false;

function ensureConfigured(): void {
  if (initialized) return;
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) {
    throw new Error(
      "Cloudinary not configured (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET missing).",
    );
  }
  cloudinary.config({
    cloud_name: name,
    api_key: key,
    api_secret: secret,
    secure: true,
  });
  initialized = true;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

/**
 * Upload a buffer (from a FormData File) to Cloudinary.
 *
 * Transformations:
 *   - auto quality + auto format (Cloudinary picks avif/webp per browser)
 *   - hard cap at 1600x1600 (downsize if larger) to keep CDN egress bounded
 *   - strip exif (privacy — raw phone uploads leak geolocation)
 *
 * Thumbnail URL uses Cloudinary's URL-level transformation so no second
 * upload needed; 400w variant for grid view.
 */
export async function uploadRecipePhoto(
  buffer: Buffer,
  recipeSlug: string,
): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  const folder = `tarifle/recipe-photos/${recipeSlug}`;
  const uploaded: UploadApiResponse = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "jpg", // normalize — originals were heic/png/etc; serve jpg with auto format override downstream
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
        // Remove EXIF so user uploads don't leak GPS / camera serials.
        image_metadata: false,
        // Overwrite would collide if two users upload same-hash photo — let
        // Cloudinary auto-suffix with unique public_id.
        unique_filename: true,
        use_filename: false,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result) return reject(new Error("Cloudinary returned empty result"));
        resolve(result);
      },
    );
    stream.end(buffer);
  });

  const thumbnailUrl = buildThumbnailUrl(uploaded.secure_url);

  return {
    publicId: uploaded.public_id,
    secureUrl: uploaded.secure_url,
    thumbnailUrl,
    width: uploaded.width,
    height: uploaded.height,
    bytes: uploaded.bytes,
    format: uploaded.format,
  };
}

/**
 * URL-level thumbnail transformation. Cloudinary generates on-demand;
 * first request takes 200-500ms, cached after.
 *
 * Pattern swap: `/upload/` → `/upload/w_400,h_400,c_fill,q_auto,f_auto/`
 */
export function buildThumbnailUrl(secureUrl: string): string {
  return secureUrl.replace(
    "/upload/",
    "/upload/w_400,h_400,c_fill,q_auto,f_auto/",
  );
}

/**
 * Delete a Cloudinary asset by `public_id`. Used when an admin or the
 * photo owner removes their upload. Idempotent — Cloudinary returns
 * `{ result: "not found" }` for missing IDs without throwing.
 */
export async function deleteRecipePhoto(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
