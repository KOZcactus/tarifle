"use client";

/**
 * Root-level error boundary. Next.js uncaught client exception olunca
 * bu component render edilir; aynı anda Sentry'ye raporlar. DSN yoksa
 * captureException no-op.
 *
 * `global-error.tsx` layout'u bypass eder — kendi <html><body> sarar.
 * Tarifle renk paletini inline tutuyoruz (global CSS yüklenmemiş olabilir).
 */

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#f8f6f2",
          color: "#1a1a1a",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          🍽️ Bir şeyler yanlış gitti
        </h1>
        <p style={{ maxWidth: 480, marginBottom: "1.5rem", color: "#666" }}>
          Beklenmedik bir hata oluştu. Sorun kayıt altına alındı, ekibimize
          iletildi. Tekrar denemek veya ana sayfaya dönmek ister misin?
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#999", marginBottom: "1.5rem" }}>
            Hata kimliği: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "#a03b0f",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            style={{
              padding: "0.6rem 1.2rem",
              border: "1px solid #ddd",
              borderRadius: "0.5rem",
              color: "#1a1a1a",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            Ana sayfa
          </Link>
        </div>
      </body>
    </html>
  );
}
