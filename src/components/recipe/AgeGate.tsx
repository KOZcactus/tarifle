"use client";

import { useState, useEffect } from "react";

const AGE_GATE_KEY = "tarifle_age_verified";

interface AgeGateProps {
  children: React.ReactNode;
}

export function AgeGate({ children }: AgeGateProps) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(AGE_GATE_KEY);
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
      <div className="mx-4 w-full max-w-md rounded-2xl bg-bg p-8 text-center shadow-2xl">
        <span className="mb-4 inline-block text-5xl">🍸</span>
        <h2 className="font-heading text-xl font-bold text-text">
          Yaş Doğrulama
        </h2>
        <p className="mt-3 text-sm text-text-muted">
          Bu tarif alkollü içecek içermektedir. İçeriği görüntülemek için 18 yaşından büyük
          olduğunuzu onaylamanız gerekmektedir.
        </p>
        <div className="mt-3 rounded-lg bg-secondary/10 px-3 py-2">
          <p className="text-xs text-secondary">
            Alkollü içeceklerin sorumlu tüketimi önemlidir.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            18 yaşından büyüğüm, devam et
          </button>
          <button
            onClick={() => window.history.back()}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated"
          >
            Geri dön
          </button>
        </div>
      </div>
    </div>
  );
}
