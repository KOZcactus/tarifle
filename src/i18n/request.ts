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

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = isValidLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
