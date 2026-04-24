"use client";

/**
 * Tarif detay sayfası error boundary (oturum 19 FUTURE_PLANS paketi).
 *
 * Root error.tsx yerine burada daha spesifik fallback: tarif silinmiş,
 * draft moderasyonu, DB timeout, veya slug map drift. Navbar + footer
 * ayakta kalır, sadece tarif içerik alanında error görünür.
 */

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

interface RecipeErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RecipeError({ error, reset }: RecipeErrorProps) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("boundary", "recipe-detail");
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-6xl">🍳</span>
      <h1 className="mt-6 font-heading text-2xl font-bold">
        Tarif yüklenemedi
      </h1>
      <p className="mt-3 text-text-muted">
        Bu tarif şu an gösterilemiyor. Silinmiş, geçici bir sunucu hatası veya
        yenileme sırası olabilir.
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
          Tüm tarifler
        </Link>
        <Link
          href="/"
          className="rounded-xl px-4 py-3 text-sm font-medium text-text-muted transition-colors hover:text-text"
        >
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
