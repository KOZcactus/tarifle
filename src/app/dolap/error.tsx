"use client";

/**
 * Dolap (pantry) error boundary (oturum 19 FUTURE_PLANS paketi).
 *
 * UserPantryItem sorgu timeout, mutation rate limit, nadir Prisma
 * connection hatasi. Navbar + footer ayakta, sadece dolap alaninda
 * error. Kullanici verisi kayip olmadigi icin "tekrar dene" guvenli.
 */

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

interface PantryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PantryError({ error, reset }: PantryErrorProps) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("boundary", "pantry");
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-6xl">🎒</span>
      <h1 className="mt-6 font-heading text-2xl font-bold">
        Dolap şu an yüklenemedi
      </h1>
      <p className="mt-3 text-text-muted">
        Dolabını görüntülerken geçici bir sorun yaşandı. Listen güvende, sadece
        bu sayfa yenilenmeli. Sorun sürerse ana sayfadan devam edebilirsin.
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
          href="/"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-card"
        >
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
