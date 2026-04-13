import Link from "next/link";
import { CATEGORIES } from "@/data/categories";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center py-20 text-center lg:py-32">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Lezzetli tarifler,
          <br />
          <span className="text-primary">topluluk katkısıyla.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-text-muted">
          Yemek, içecek ve kokteyl tariflerini keşfet. Kendi varyasyonlarını paylaş. Sade, hızlı
          okunur, pratik.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/tarifler"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Tariflere Göz At
          </Link>
          <Link
            href="/kesfet"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-bg-card"
          >
            Keşfet
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <h2 className="font-heading text-2xl font-bold">Kategoriler</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/tarifler/${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary hover:shadow-lg"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-center text-sm font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Recipes Placeholder */}
      <section className="py-16">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold">Öne Çıkan Tarifler</h2>
          <Link href="/tarifler" className="text-sm text-primary hover:underline">
            Tümünü gör
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl border border-border bg-bg-card"
            />
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-text-muted">
          Tarifler yakında burada olacak.
        </p>
      </section>
    </div>
  );
}
