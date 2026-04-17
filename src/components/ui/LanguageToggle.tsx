"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { updateLocaleAction } from "@/lib/actions/locale";
import { useDismiss } from "@/hooks/useDismiss";

/**
 * Navbar language selector — küçük flag icon butonu + dropdown menüsü.
 * Seçim yapılınca updateLocaleAction cookie + (varsa) User.locale yazar,
 * revalidatePath tam tree'yi yeniden render eder. Client state sıfır —
 * kaynak her zaman cookie + RSC.
 */
export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  const ref = useDismiss<HTMLDivElement>({ isOpen, onClose: close });

  const handleSelect = (next: Locale) => {
    if (next === locale) {
      setIsOpen(false);
      return;
    }
    const form = formRef.current;
    if (!form) return;
    const input = form.elements.namedItem("locale");
    if (input instanceof HTMLInputElement) {
      input.value = next;
    }
    startTransition(() => {
      form.requestSubmit();
      setIsOpen(false);
    });
  };

  const current = LOCALE_LABELS[locale];

  return (
    <div className="relative" ref={ref}>
      <form ref={formRef} action={updateLocaleAction} className="hidden">
        <input type="hidden" name="locale" defaultValue={locale} />
      </form>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("toggleLanguage")}
        disabled={pending}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-base transition-colors hover:bg-bg-card disabled:opacity-60"
      >
        <span aria-hidden>{current.flag}</span>
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-border bg-bg-card py-1 shadow-lg"
        >
          {LOCALES.map((code) => {
            const meta = LOCALE_LABELS[code];
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(code)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-bg-elevated focus-visible:bg-bg-elevated focus-visible:outline-none ${
                  active ? "font-semibold text-primary" : "text-text"
                }`}
                aria-current={active ? "true" : undefined}
              >
                <span aria-hidden>{meta.flag}</span>
                <span>{meta.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
