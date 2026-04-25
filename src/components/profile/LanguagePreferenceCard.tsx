"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { updateLocaleAction } from "@/lib/actions/locale";

/**
 * Language preference card, /ayarlar sayfasında render edilir.
 * Seçim updateLocaleAction çağırır: cookie set + logged-in ise
 * User.locale update + revalidatePath ile full tree refresh.
 *
 * Navbar'daki LanguageToggle ile aynı server action'ı paylaşır, kaynak
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
    <section className="rounded-xl border border-border bg-bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-sm font-semibold text-text">
            {t("languageTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {t("languageDescription")}
          </p>
        </div>

        <div
          role="radiogroup"
          className="inline-flex shrink-0 rounded-lg border border-border bg-bg p-0.5"
        >
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
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text"
                }`}
              >
                <span aria-hidden>{meta.flag}</span>
                <span>{meta.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
