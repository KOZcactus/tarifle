import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="text-7xl">🍽️</span>
      <h1 className="mt-6 font-heading text-4xl font-bold">404</h1>
      <p className="mt-3 text-lg text-text-muted">
        Aradığınız sayfa bulunamadı.
      </p>
      <p className="mt-1 text-sm text-text-muted">
        Belki de yanlış bir tarif yoluna saptınız.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Ana Sayfa
        </Link>
        <Link
          href="/tarifler"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-card"
        >
          Tarifler
        </Link>
      </div>
    </div>
  );
}
