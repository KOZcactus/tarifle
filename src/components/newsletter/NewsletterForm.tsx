"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { subscribeNewsletterAction } from "@/lib/actions/newsletter";

interface NewsletterFormProps {
  /** `footer` (compact, muted) veya `inline` (daha belirgin, ana sayfa
   *  section). Footer'da küçük input + button sağa yaslı; inline'da
   *  sayfa başlığıyla birlikte geniş. */
  variant?: "footer" | "inline";
}

/**
 * Haftalık editör seçkisi aboneliği. Double-opt-in: form submit sonrası
 * onay maili gider, kullanıcı tıklayınca ACTIVE olur. Başarılı submit
 * sonrası form input'u temizlenir + inline confirmation mesajı görünür.
 */
export function NewsletterForm({ variant = "footer" }: NewsletterFormProps) {
  const t = useTranslations("newsletter.form");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      const res = await subscribeNewsletterAction(email);
      if (res.success) {
        setResult({
          ok: true,
          msg: res.message ?? t("success"),
        });
        setEmail("");
      } else {
        setResult({
          ok: false,
          msg: res.error ?? t("error"),
        });
      }
    });
  }

  if (variant === "inline") {
    return (
      <div className="rounded-2xl border border-border bg-bg-card p-6 sm:p-8">
        <h2 className="font-heading text-xl font-bold text-text sm:text-2xl">
          {t("inlineHeading")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {t("inlineSubtitle")}
        </p>
        {/* Somut ornek konu basliklari: GPT audit'i "kullaniciya ne
            alacagini ve hangi siklikta alacagini net anlatan kucuk bir
            email alani + ornek konu basliklari eklenmeli" dedi. Siklik
            (haftada bir) zaten inlineSubtitle'da; burada icerik sinyali. */}
        <div className="mt-4 rounded-lg border border-dashed border-border bg-bg p-3">
          <p className="text-xs font-medium text-text">
            {t("inlineExamplesTitle")}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-text-muted">
            <li className="flex gap-2">
              <span aria-hidden="true" className="shrink-0 text-primary">
                •
              </span>
              <span>{t("inlineExample1")}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="shrink-0 text-primary">
                •
              </span>
              <span>{t("inlineExample2")}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="shrink-0 text-primary">
                •
              </span>
              <span>{t("inlineExample3")}</span>
            </li>
          </ul>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            disabled={pending}
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </form>
        {result && (
          <p
            className={`mt-3 text-xs ${
              result.ok ? "text-accent-green" : "text-error"
            }`}
          >
            {result.msg}
          </p>
        )}
        <p className="mt-3 text-[11px] text-text-muted">{t("privacyHint")}</p>
      </div>
    );
  }

  // Footer compact variant.
  return (
    <div>
      <h3 className="text-sm font-semibold text-text">{t("footerHeading")}</h3>
      <p className="mt-2 text-xs text-text-muted">{t("footerSubtitle")}</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          disabled={pending}
          className="flex-1 rounded-md border border-border bg-bg px-2.5 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "…" : t("submit")}
        </button>
      </form>
      {result && (
        <p
          className={`mt-2 text-[11px] ${
            result.ok ? "text-accent-green" : "text-error"
          }`}
        >
          {result.msg}
        </p>
      )}
    </div>
  );
}
