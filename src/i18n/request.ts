/**
 * next-intl request config — App Router server tarafı her render'da bunu
 * çağırır, aktif locale + messages döner. Cookie-based yaklaşım (URL
 * routing yok): kullanıcı açıkça TR/EN seçmedikçe TR kalır.
 *
 * Locale kaynağı öncelik:
 *   1. NEXT_LOCALE cookie (user ayarlardan/navbar'dan seçmiş)
 *   2. DEFAULT_LOCALE ("tr")
 *
 * Accept-Language bilinçli olarak atlandı — "kullanıcı değiştirmezse TR"
 * kuralı tarayıcı default'undan bağımsız olsun. Anonymous user da TR
 * görür.
 *
 * User login'de auth callback'inde User.locale cookie'ye sync'lenir
 * (sonraki pass).
 */

import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "./config";

/**
 * Caller `getTranslations({ locale })` ile explicit locale verdiyse (örn.
 * OG image `generateImageMetadata` her locale için ayrı prerender ediyor)
 * o değeri kullan — `cookies()` çağırmaz, yani OG image gibi static
 * generation gereken route'lar dynamic server usage'a düşmez.
 *
 * Normal sayfa render'ında `requestLocale` null/undefined olur; o zaman
 * cookie'den oku (mevcut cookie-based flow).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const explicit = await requestLocale;
  let locale: Locale;
  if (isValidLocale(explicit)) {
    locale = explicit;
  } else {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get("NEXT_LOCALE")?.value;
    locale = isValidLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
