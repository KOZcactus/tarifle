"use client";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="text-7xl">⚠️</span>
      <h1 className="mt-6 font-heading text-3xl font-bold">Bir şeyler ters gitti</h1>
      <p className="mt-3 text-text-muted">
        Sayfa yüklenirken beklenmeyen bir hata oluştu.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
