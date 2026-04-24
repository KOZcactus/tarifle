"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updatePantryPreferencesAction } from "@/lib/actions/pantry-preferences";

interface PantryPreferencesCardProps {
  initialPantryExpiryTracking: boolean;
}

/**
 * /ayarlar sayfasinda Dolap tercihleri bolumu.
 *
 * Tek toggle:
 *   - pantryExpiryTracking: Son kullanma tarihi takibi. Default kapali.
 *     Acilinca /dolap sayfasinda her item icin tarih input + yaklasan
 *     SKT uyari banner'i gorunur.
 *
 * Kerem direktifi oturum 18: Basit default + opt-in gelismis ayar.
 * Kullanici cok fazla UI ile karsilasmasin.
 */
export function PantryPreferencesCard({ initialPantryExpiryTracking }: PantryPreferencesCardProps) {
  const t = useTranslations("settings.pantry");
  const [expiry, setExpiry] = useState(initialPantryExpiryTracking);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function toggleExpiry(next: boolean) {
    setExpiry(next);
    setStatus("idle");
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updatePantryPreferencesAction({
        pantryExpiryTracking: next,
      });
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "unknown");
        // Rollback optimistic state
        setExpiry(!next);
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-bg-card p-5">
      <header className="mb-3">
        <h2 className="font-heading text-lg font-semibold text-text">
          {t("heading")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border bg-bg p-3 transition-colors hover:border-primary/40">
          <span className="flex-1">
            <span className="block text-sm font-medium text-text">
              {t("expiryTrackingLabel")}
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">
              {t("expiryTrackingDescription")}
            </span>
          </span>
          <span className="relative inline-flex shrink-0 items-center pt-1">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={expiry}
              onChange={(e) => toggleExpiry(e.target.checked)}
              disabled={isPending}
            />
            <span
              aria-hidden="true"
              className="block h-6 w-11 rounded-full bg-bg-elevated transition-colors peer-checked:bg-primary peer-disabled:opacity-50"
            />
            <span
              aria-hidden="true"
              className="absolute left-0.5 top-1.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
            />
          </span>
        </label>
      </div>

      <p
        aria-live="polite"
        className={`mt-3 min-h-[1rem] text-xs ${
          status === "success"
            ? "text-accent-green"
            : status === "error"
              ? "text-error"
              : "text-text-muted"
        }`}
      >
        {status === "success" && t("savedMessage")}
        {status === "error" && (errorMessage ?? t("errorMessage"))}
      </p>
    </section>
  );
}
