"use client";

/**
 * Admin panel error boundary (oturum 19 FUTURE_PLANS paketi).
 *
 * Admin sayfalarında Prisma sorgu hatası, yanlış permission drift veya
 * aggregate query fail. Admin layout sidebar ayakta, sadece içerik
 * alanında error. Sentry'ye "admin" tag ile gönderir, admin issue'lar
 * filter edilebilir.
 */

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("boundary", "admin");
      scope.setLevel("error");
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-6xl">⚙️</span>
      <h1 className="mt-6 font-heading text-2xl font-bold">
        Admin paneli hatası
      </h1>
      <p className="mt-3 text-text-muted">
        Bu admin sayfası şu an yüklenemedi. Sentry&apos;ye kayıt gitti,
        inceleme bekliyor.
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
          href="/admin"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-card"
        >
          Admin ana
        </Link>
      </div>
    </div>
  );
}
