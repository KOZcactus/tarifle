"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Log boundary errors so ops gets signal in Vercel function logs + Sentry.
  // Oturum 19 a11y/error audit: onceden sadece console.error vardi, Sentry'ye
  // haber gitmiyordu (sadece global-error'da vardi). Route-level crash'ler
  // de artik Sentry'ye gidiyor.
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="text-7xl">⚠️</span>
      <h1 className="mt-6 font-heading text-3xl font-bold">Bir şeyler ters gitti</h1>
      <p className="mt-3 text-text-muted">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Sorun kayıt altına alındı.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-text-muted">Hata kimliği: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
