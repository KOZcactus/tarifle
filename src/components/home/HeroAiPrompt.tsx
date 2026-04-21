"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Hero alaninda inline AI malzeme prompt'u. Kullanici elindeki 2-4
 * malzemeyi virgulle yazar, istege bagli sure chip'i secer, submit ile
 * `/ai-asistan?m=<urlencoded>&sure=<optional>` URL'ine yonlendirilir.
 *
 * AiAssistantForm zaten `useSearchParams` ile m/sure/tur/haric/diyet
 * query param'larini okuyup form'u dolduruyor (src/components/ai/
 * AiAssistantForm.tsx line 129 civari); bu prompt sadece submit sonrasi
 * url uretir.
 *
 * GPT audit: "en guclu urun parcasi olan 'elindeki malzemeye gore tarif
 * bulma' daha yukari alinmali. Hero alanina dogrudan malzeme girisi +
 * sure secimi + 'Tarif oner' CTA'si koymak, AI Asistan'a giden donusumu
 * artirir". Karar-motoru konumlanmasi icin hero baskin sinyal.
 *
 * Mevcut AI banner (home.aiBannerTitle kart'i) korunuyor: hero prompt
 * hizli girish; banner daha detayli anlatim + CTA (kullanici isterse
 * zengin form icin /ai-asistan'a gider, iki yollu erisim).
 */
export function HeroAiPrompt() {
  const t = useTranslations("home.heroAiPrompt");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [time, setTime] = useState<number | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const clean = value.trim();
    if (clean) params.set("m", clean);
    if (time !== null) params.set("sure", String(time));
    const qs = params.toString();
    router.push(qs ? `/ai-asistan?${qs}` : "/ai-asistan");
  }

  return (
    <div className="mt-6 w-full max-w-xl rounded-2xl border border-border bg-bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-start gap-3 text-left">
        <span aria-hidden="true" className="text-2xl">
          🤖
        </span>
        <div>
          <p className="text-sm font-semibold text-text">{t("title")}</p>
          <p className="mt-0.5 text-xs text-text-muted">{t("subtitle")}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="hero-ai-ings" className="sr-only">
          {t("inputLabel")}
        </label>
        <input
          id="hero-ai-ings"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("inputLabel")}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">{t("timeLabel")}</span>
          {[15, 30, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setTime(time === mins ? null : mins)}
              aria-pressed={time === mins}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                time === mins
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg text-text-muted hover:border-primary/60"
              }`}
            >
              {t("timeOption", { n: mins })}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
