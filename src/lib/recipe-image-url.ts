/**
 * Recipe image URL transform helper.
 *
 * Web'de `recipe.imageUrl` field'ı relative path tutar
 * (örn. `/recipe-images/generated/adana-kebap.webp`).
 * Mobile app `<Image source={{ uri }} />` absolute URL bekler.
 *
 * Bu helper backend API response'unda relative path'i absolute'a çevirir.
 * Mobile-ready API endpoint'lerinde response middleware olarak kullan.
 *
 * Web Next.js Image component otomatik relative kabul ettiği için
 * web tarafında çağrı gerek değil; sadece mobile JSON response'da çağır.
 *
 * Phase 0 (oturum 33+ planlanan): bu helper API route handler'larında
 * `recipe.imageUrl` döndürmeden önce çağrılır. Fonksiyon idempotent
 * (zaten absolute olan URL'i tekrar prefix etmez).
 */

const DEFAULT_PUBLIC_BASE_URL = "https://tarifle.app";

/**
 * Tek bir image URL'i absolute hale getirir.
 *
 * @param imageUrl - relative ("/recipe-images/...") veya absolute
 *   ("https://...") veya null
 * @param baseUrl - public base URL, default `process.env.NEXT_PUBLIC_SITE_URL`
 *   veya `https://tarifle.app`
 * @returns absolute URL veya null
 *
 * @example
 * toAbsoluteImageUrl("/recipe-images/generated/adana-kebap.webp")
 * // → "https://tarifle.app/recipe-images/generated/adana-kebap.webp"
 *
 * toAbsoluteImageUrl("https://res.cloudinary.com/.../adana-kebap.jpg")
 * // → "https://res.cloudinary.com/.../adana-kebap.jpg" (absolute, dokunma)
 *
 * toAbsoluteImageUrl(null) // → null
 */
export function toAbsoluteImageUrl(
  imageUrl: string | null | undefined,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_PUBLIC_BASE_URL,
): string | null {
  if (!imageUrl) return null;
  // Zaten absolute (http/https/data/blob)
  if (/^(https?|data|blob):/i.test(imageUrl)) return imageUrl;
  // Relative, prefix et (trailing slash sanitize)
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Bir recipe object'in tüm image alanlarını absolute hale getirir.
 * Recipe'in iç içe `imageUrl` veya `image` field'ları varsa hepsi
 * dönüşür. Optional Next.js Image API resize URL'leri de absolute olur.
 *
 * @param recipe - Recipe-benzeri object (imageUrl alanı içeren)
 * @param baseUrl - opsiyonel custom base URL
 * @returns aynı object, imageUrl absolute
 */
export function withAbsoluteImageUrls<T extends { imageUrl?: string | null }>(
  recipe: T,
  baseUrl?: string,
): T {
  return {
    ...recipe,
    imageUrl: toAbsoluteImageUrl(recipe.imageUrl, baseUrl),
  };
}

/**
 * Recipe array için bulk transform.
 */
export function withAbsoluteImageUrlsArray<T extends { imageUrl?: string | null }>(
  recipes: T[],
  baseUrl?: string,
): T[] {
  return recipes.map((r) => withAbsoluteImageUrls(r, baseUrl));
}

/**
 * Next.js Image API üzerinden resize edilmiş URL üretir.
 * Mobile farklı görsel boyutları ister (thumbnail 400px, hero 1600px).
 * Vercel'in built-in image optimization'ını kullanır.
 *
 * @example
 * resizedImageUrl("/recipe-images/generated/adana.webp", { w: 400 })
 * // → "https://tarifle.app/_next/image?url=%2Frecipe-images%2F...&w=400&q=75"
 */
export function resizedImageUrl(
  imageUrl: string | null | undefined,
  opts: { w?: number; q?: number } = {},
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_PUBLIC_BASE_URL,
): string | null {
  if (!imageUrl) return null;
  // External URL'leri Vercel image optimization'a sokma (allowlist gerekir)
  if (/^https?:/i.test(imageUrl) && !imageUrl.startsWith(baseUrl)) {
    return imageUrl;
  }
  const cleanBase = baseUrl.replace(/\/$/, "");
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const params = new URLSearchParams({
    url: path,
    w: String(opts.w ?? 800),
    q: String(opts.q ?? 75),
  });
  return `${cleanBase}/_next/image?${params.toString()}`;
}
