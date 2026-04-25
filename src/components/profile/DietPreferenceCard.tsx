"use client";

import { useState, useTransition } from "react";
import { setDietProfileAction } from "@/lib/actions/user-diet-profile";
import { DIET_PROFILES } from "@/lib/diet-scoring/profiles";

interface DietPreferenceCardProps {
  initialDietProfile: string | null;
}

/**
 * Diyet profili secimi card'i, /ayarlar sayfasinda PreferencesCard'in
 * yaninda render edilir. 6 preset + "Hicbiri" secenegi.
 *
 * Beta uyarisi: Faz 1'de skor proxy yontemleri kullaniyor, Faz 2 USDA
 * enrichment sonrasi kesinlesir. Kullanici beklenti yonetimi.
 */
export function DietPreferenceCard({ initialDietProfile }: DietPreferenceCardProps) {
  const [selected, setSelected] = useState<string | null>(initialDietProfile);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelect = (slug: string | null) => {
    if (selected === slug) return;
    setSelected(slug);
    setStatus("idle");
    setErrorMessage(null);

    startTransition(async () => {
      const result = await setDietProfileAction(slug);
      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Bilinmeyen hata");
      }
    });
  };

  return (
    <section
      id="diyet"
      aria-labelledby="diyet-heading"
      className="rounded-lg border border-border bg-surface p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="diyet-heading"
          className="font-heading text-xl font-bold tracking-tight"
        >
          Diyet Tercihi
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          Beta
        </span>
      </div>

      <p className="mt-2 text-sm text-text-muted">
        Tarifleri seçtiğin diyete göre 0-100 arası skorlarız. Skor recipe
        kartında ve detayında görünür. Hesaplama kullanılan veriye göre
        yaklaşık olabilir; bilgi amaçlıdır, diyetisyen tavsiyesi yerine
        geçmez.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DIET_PROFILES.map((profile) => {
          const isSelected = selected === profile.slug;
          return (
            <button
              key={profile.slug}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(profile.slug)}
              className={
                "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors " +
                (isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:bg-primary/5")
              }
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-xl">
                  {profile.emoji}
                </span>
                <span className="font-medium">{profile.name}</span>
                {profile.requiresEnrichedData && (
                  <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                    Beta
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">{profile.description}</p>
            </button>
          );
        })}

        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSelect(null)}
          className={
            "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors " +
            (selected === null
              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
              : "border-border hover:border-primary/40 hover:bg-primary/5")
          }
          aria-pressed={selected === null}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-xl">
              ⛌
            </span>
            <span className="font-medium">Şimdilik yok</span>
          </div>
          <p className="text-xs text-text-muted">
            Skor gösterilmez, tarifler her zamanki gibi görünür.
          </p>
        </button>
      </div>

      {status === "success" && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
        >
          ✅ Diyet tercihin kaydedildi.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200"
        >
          ⚠️ {errorMessage}
        </p>
      )}
    </section>
  );
}
