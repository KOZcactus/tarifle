import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Key/value runtime flags — admin panel'den tek tıkla toggle edilir.
 * Duyurular için `Announcement` modeli ayrı; bu store yalnızca boolean
 * feature flag + kısa string config içindir.
 *
 * Cache: 60s unstable_cache + tag `site-setting:<key>`. Toggle sonrası
 * action `revalidateTag` çağırır — bir sonraki read taze değerle gelir.
 * Tam CDN invalidation değil (cross-region Neon replica yok) ama Next.js
 * local cache TTL aynı süre içinde yayılır.
 */

export const SITE_SETTING_KEYS = {
  USER_PHOTOS_ENABLED: "userPhotosEnabled",
} as const;

export type SiteSettingKey =
  (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS];

const SETTING_TAG = (key: string): string => `site-setting:${key}`;

const getSiteSettingCached = unstable_cache(
  async (key: string): Promise<string | null> => {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  },
  ["site-setting-v1"],
  { revalidate: 60 },
);

export async function getSiteSetting(key: SiteSettingKey): Promise<string | null> {
  return getSiteSettingCached(key);
}

export async function getBooleanSetting(
  key: SiteSettingKey,
  fallback = false,
): Promise<boolean> {
  const raw = await getSiteSetting(key);
  if (raw === null) return fallback;
  return raw === "true" || raw === "1";
}

/** Tek-çağrıda user-photos feature flag'i okur — hot path helper. */
export async function isUserPhotosEnabled(): Promise<boolean> {
  return getBooleanSetting(SITE_SETTING_KEYS.USER_PHOTOS_ENABLED, false);
}

/**
 * Upsert helper — sadece admin action'ından çağrılır, kendi auth guard'ı
 * vardır (admin.ts'deki toggleUserPhotosFeatureAction). Bu helper saf DB
 * writer, cache invalidation çağrıya bırakılır (server action revalidates).
 */
export async function setSiteSetting(
  key: SiteSettingKey,
  value: string,
  updatedBy?: string | null,
): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, updatedBy: updatedBy ?? null },
    update: { value, updatedBy: updatedBy ?? null },
  });
}

export { SETTING_TAG };
