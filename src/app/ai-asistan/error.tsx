"use client";

/**
 * AI Asistan error boundary (oturum 19 FUTURE_PLANS paketi).
 *
 * AI provider fail, rate limit patlaması, pantry sorgu timeout. Navbar
 * + footer ayakta, sadece asistan form alanında error. Ileride LLM
 * katmanı eklendiğinde (v5) daha kritik olacak.
 */

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

interface AiAssistantErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AiAssistantError({
  error,
  reset,
}: AiAssistantErrorProps) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("boundary", "ai-assistant");
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-6xl">✨</span>
      <h1 className="mt-6 font-heading text-2xl font-bold">
        AI Asistan şu an cevap veremiyor
      </h1>
      <p className="mt-3 text-text-muted">
        Öneri motorunda geçici bir sorun var. Birkaç saniye sonra tekrar
        denemek çoğu zaman yeter. Sorun sürerse ana sayfadan popüler tarif
        keşfedebilirsin.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-text-muted">
          Hata kimliği: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Tekrar dene
        </button>
        <Link
          href="/tarifler"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-card"
        >
          Tarif keşfet
        </Link>
      </div>
    </div>
  );
}
