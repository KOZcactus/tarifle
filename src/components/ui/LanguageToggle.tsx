"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, type Locale } from "@/i18n/config";
import { updateLocaleAction } from "@/lib/actions/locale";

/**
 * Navbar language toggle — ThemeToggle pattern'ı (single-click switch).
 * İki dil varken dropdown overkill; direkt toggle daha hızlı.
 *
 * Button content: aktif locale'in upper-case kodu ("TR" / "EN"). Flag
 * emoji (🇹🇷/🇬🇧) kullanılmıyor çünkü Windows Chrome/Edge regional
 * indicator'ı "GB"/"TR" harfi olarak render ediyor. Text fallback hem
 * cross-platform garantili hem accessible.
 *
 * Tıklandığında sıradaki locale'e geçer (LOCALES listesindeki next),
 * server action cookie + DB update + revalidatePath tree refresh.
 */
export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const [pending, startTransition] = useTransition();

  const nextLocale: Locale = (() => {
    const index = LOCALES.indexOf(locale);
    return LOCALES[(index + 1) % LOCALES.length] ?? LOCALES[0];
  })();

  const handleToggle = () => {
    const fd = new FormData();
    fd.set("locale", nextLocale);
    startTransition(() => {
      void updateLocaleAction(fd);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-label={t("toggleLanguage")}
      title={t("toggleLanguage")}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs font-semibold uppercase tracking-wide text-text transition-colors hover:bg-bg-card disabled:opacity-60"
    >
      {locale}
    </button>
  );
}
