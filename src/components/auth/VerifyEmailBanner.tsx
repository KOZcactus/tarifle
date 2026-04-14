"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmailAction } from "@/lib/actions/auth";

interface VerifyEmailBannerProps {
  email: string;
}

export function VerifyEmailBanner({ email }: VerifyEmailBannerProps) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setStatus("idle");
    setMessage(null);
    startTransition(async () => {
      const result = await resendVerificationEmailAction();
      if (result.success) {
        setStatus("sent");
        setMessage(`Doğrulama bağlantısı ${email} adresine gönderildi.`);
      } else {
        setStatus("error");
        setMessage(result.error ?? "Bilinmeyen hata.");
      }
    });
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-warning/30 bg-warning/5 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/15 text-sm text-warning">
            ⚠
          </div>
          <div>
            <p className="font-medium text-text">E-postan henüz doğrulanmadı</p>
            <p className="mt-0.5 text-sm text-text-muted">
              Doğrulanmış kullanıcı rozetini kazanmak için <strong>{email}</strong>{" "}
              adresine gelen bağlantıya tıkla.
            </p>
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={isPending || status === "sent"}
          className="shrink-0 rounded-lg border border-warning/40 bg-bg-card px-4 py-2 text-sm font-medium text-warning transition-colors hover:bg-warning/10 disabled:opacity-60"
        >
          {isPending ? "Gönderiliyor…" : status === "sent" ? "Gönderildi ✓" : "Tekrar gönder"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-xs ${
            status === "error" ? "text-error" : "text-text-muted"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
