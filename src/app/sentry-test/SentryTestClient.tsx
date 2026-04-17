"use client";

/**
 * Client-side throw — browser JS hatası. sentry.client.config.ts'deki
 * Sentry.init tarafından otomatik yakalanır ve ingest'e gönderilir.
 */

export function SentryTestClient() {
  return (
    <button
      type="button"
      onClick={() => {
        // Bilerek crash — Sentry capture ettiği stack trace'de bu satır
        // görünecek (source map yüklenmişse).
        throw new Error("Sentry client-side test error — butondan tetiklendi");
      }}
      className="mt-2 rounded-lg bg-error/15 px-3 py-2 text-sm font-medium text-error hover:bg-error/25"
    >
      Client-side hata fırlat
    </button>
  );
}
