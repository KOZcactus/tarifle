import Link from "next/link";
import { getDietProfile } from "@/lib/diet-scoring/profiles";
import type { ScoreResult } from "@/lib/diet-scoring/types";

interface DietFitCardProps {
  dietSlug: string;
  result: ScoreResult;
}

/**
 * Tarif detayinda "Diyet Uyumu" karti. Skor + breakdown + Beta uyarisi.
 * RecipeDietScore tablosundan gelen pre-computed skor breakdown'u render
 * eder. UI'da tarif "Beslenme Bilgisi" kartinin yaninda durur.
 */
export function DietFitCard({ dietSlug, result }: DietFitCardProps) {
  const profile = getDietProfile(dietSlug);
  if (!profile) return null;

  const ratingColors: Record<ScoreResult["rating"], { bar: string; chip: string; label: string }> = {
    excellent: {
      bar: "bg-emerald-500 dark:bg-emerald-400",
      chip: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
      label: "Mükemmel uyum",
    },
    good: {
      bar: "bg-emerald-400 dark:bg-emerald-500",
      chip: "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300",
      label: "İyi uyum",
    },
    fair: {
      bar: "bg-amber-400 dark:bg-amber-500",
      chip: "bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
      label: "Orta uyum",
    },
    weak: {
      bar: "bg-orange-400 dark:bg-orange-500",
      chip: "bg-orange-50 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200",
      label: "Zayıf uyum",
    },
    poor: {
      bar: "bg-red-400 dark:bg-red-500",
      chip: "bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-200",
      label: "Uyumsuz",
    },
  };

  const colors = ratingColors[result.rating];

  return (
    <section
      aria-labelledby="diet-fit-heading"
      className="rounded-lg border border-border bg-surface p-5"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3
            id="diet-fit-heading"
            className="font-heading text-lg font-bold tracking-tight"
          >
            <span aria-hidden="true" className="mr-1.5">
              {profile.emoji}
            </span>
            {profile.name} Uyumu
          </h3>
          <p className="mt-0.5 text-sm text-text-muted">{colors.label}</p>
        </div>
        {result.isBeta && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            Beta
          </span>
        )}
      </header>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className={"rounded-full px-2.5 py-0.5 text-sm font-bold " + colors.chip}>
            {result.score}/100
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/40">
          <div
            className={"h-full transition-all " + colors.bar}
            style={{ width: `${result.score}%` }}
            role="progressbar"
            aria-valuenow={result.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Diyet uyumu skoru ${result.score} / 100`}
          />
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {result.criteria.map((c) => {
          const icon =
            c.status === "ok" ? "✅" : c.status === "warning" ? "⚠️" : "❌";
          return (
            <li key={c.label} className="flex items-start gap-2.5 text-sm">
              <span aria-hidden="true" className="mt-0.5">
                {icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{c.label}</span>
                  <span className="shrink-0 tabular-nums text-xs text-text-muted">
                    +{c.score}/{c.max}
                  </span>
                </div>
                {c.note && (
                  <p className="mt-0.5 text-xs text-text-muted">{c.note}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {result.approximationFlag && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          ℹ️ {result.approximationFlag}
        </p>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
        <Link href="/ayarlar#diyet" className="text-primary hover:underline">
          Diyetimi değiştir
        </Link>
        <span aria-hidden="true">·</span>
        <span>Bilgi amaçlıdır, diyetisyen tavsiyesi yerine geçmez.</span>
      </footer>
    </section>
  );
}
