"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const AGE_GATE_KEY = "tarifle_age_verified";

interface AgeGateProps {
  children: React.ReactNode;
}

export function AgeGate({ children }: AgeGateProps) {
  const t = useTranslations("ageGate");
  const [verified, setVerified] = useState<boolean | null>(null);

  // SSR-hydration gate: sessionStorage only exists on the client, so we
  // read it once after mount.
  useEffect(() => {
    const stored = sessionStorage.getItem(AGE_GATE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerified(stored === "true");
  }, []);

  const handleConfirm = () => {
    sessionStorage.setItem(AGE_GATE_KEY, "true");
    setVerified(true);
  };

  // Loading state — don't flash content
  if (verified === null) {
    return null;
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        className="mx-4 w-full max-w-md rounded-2xl bg-bg p-8 text-center shadow-2xl"
      >
        <span aria-hidden="true" className="mb-4 inline-block text-5xl">🍸</span>
        <h2 id="age-gate-title" className="font-heading text-xl font-bold text-text">
          {t("title")}
        </h2>
        <p id="age-gate-desc" className="mt-3 text-sm text-text-muted">
          {t("description")}
        </p>
        <div className="mt-3 rounded-lg bg-secondary/10 px-3 py-2">
          <p className="text-xs text-secondary">{t("responsibility")}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t("confirm")}
          </button>
          <button
            onClick={() => window.history.back()}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated"
          >
            {t("back")}
          </button>
        </div>
      </div>
    </div>
  );
}
