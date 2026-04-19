"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleUserPhotosFeatureAction } from "@/lib/actions/recipe-photo";

interface UserPhotosFeatureToggleProps {
  initialEnabled: boolean;
}

export function UserPhotosFeatureToggle({
  initialEnabled,
}: UserPhotosFeatureToggleProps) {
  const t = useTranslations("admin.userPhotos");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    startTransition(async () => {
      const result = await toggleUserPhotosFeatureAction(next);
      if (result.success) {
        setEnabled(next);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={enabled}
        className={`inline-flex h-7 w-14 items-center rounded-full border transition-colors ${
          enabled
            ? "border-accent-green/50 bg-accent-green/30"
            : "border-border bg-bg-elevated"
        } ${isPending ? "opacity-60" : ""}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-8" : "translate-x-1"
          }`}
          aria-hidden="true"
        />
        <span className="sr-only">
          {enabled ? t("toggleTurnOff") : t("toggleTurnOn")}
        </span>
      </button>
      <span className="text-sm font-medium text-text">
        {enabled ? t("stateOn") : t("stateOff")}
      </span>
    </div>
  );
}
