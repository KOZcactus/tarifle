"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { updateLocaleAction } from "@/lib/actions/locale";
import { useDismiss } from "@/hooks/useDismiss";

/**
 * Navbar language selector, dropdown pattern (yanlış tıklamalarda
 * kullanıcı dropdown görüp iptal edebilir, accidental switch önlenir).
 *
 * Flag emoji (🇹🇷/🇬🇧) kullanılmıyor, Windows Chrome/Edge regional
 * indicator'ı "GB"/"TR" harfi olarak render ediyor. Yerine locale
 * code upper-case text ("TR" / "EN"). Tüm platformlarda garantili.
 *
 * Seçim → updateLocaleAction cookie + (logged-in) User.locale +
 * revalidatePath tree refresh. Client state sıfır, kaynak cookie + RSC.
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
        // WCAG label-content-name-mismatch: visible text "TR" accessible
        // name'in basinda olmali (voice control "click TR" diyebilsin).
        aria-label={`${locale.toUpperCase()}, ${t("toggleLanguage")}`}
        disabled={pending}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs font-semibold uppercase tracking-wide text-text transition-colors hover:bg-bg-card disabled:opacity-60"
      >
        {locale}
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
                <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded border border-border/60 bg-bg px-1.5 text-[10px] font-bold uppercase tracking-wide">
                  {code}
                </span>
                <span>{meta.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
