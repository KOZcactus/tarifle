"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { updateLocaleAction } from "@/lib/actions/locale";

/**
 * Language preference card — /ayarlar sayfasında render edilir.
 * Seçim updateLocaleAction çağırır: cookie set + logged-in ise
 * User.locale update + revalidatePath ile full tree refresh.
 *
 * Navbar'daki LanguageToggle ile aynı server action'ı paylaşır — kaynak
 * her zaman cookie + (varsa) DB. Client state yok, kaybolmaz.
 */
export function LanguagePreferenceCard() {
  const locale = useLocale() as Locale;
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  const handleChange = (next: Locale) => {
    if (next === locale) return;
    const fd = new FormData();
    fd.set("locale", next);
    startTransition(() => {
      void updateLocaleAction(fd);
    });
  };

  return (
    <section className="rounded-xl border border-border bg-bg-card p-5">
      <header className="mb-3">
        <h2 className="font-heading text-base font-semibold text-text">
          {t("languageTitle")}
        </h2>
      </header>

      <p className="mb-3 text-sm text-text-muted">{t("languageDescription")}</p>

      <div role="radiogroup" className="flex flex-col gap-2 sm:flex-row">
        {LOCALES.map((code) => {
          const meta = LOCALE_LABELS[code];
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleChange(code)}
              disabled={pending}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-bg text-text hover:bg-bg-elevated"
              }`}
            >
              <span aria-hidden>{meta.flag}</span>
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
