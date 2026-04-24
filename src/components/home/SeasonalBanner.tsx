import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSeasonalRecipes } from "@/lib/queries/seasonal-recipes";

/**
 * Sezon + bayram banner (AI #2, oturum 17). Home sayfasının üst
 * bölümünde aktif sezona veya yaklaşan bayrama özel 4-6 tariflik
 * seçki. Boş pool gelirse hiç render etmez (home layout bozulmaz).
 *
 * Her istekte server-render, unstable_cache 6 saat TTL. Sezon geçişi
 * günü gün bazında banner otomatik değişir.
 */
export async function SeasonalBanner() {
  const [{ collection, recipes }, tHome] = await Promise.all([
    getSeasonalRecipes(),
    getTranslations("home.seasonal"),
  ]);

  if (recipes.length === 0) return null;

  return (
    <section
      aria-labelledby="seasonal-heading"
      className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5 dark:border-amber-500/30 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/30 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="seasonal-heading"
              className="font-heading text-xl font-bold text-text sm:text-2xl"
            >
              {collection.title}
            </h2>
            {collection.countdownLabel && (
              <span className="rounded-full border border-amber-400/60 bg-amber-100/80 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:border-amber-500/50 dark:bg-amber-900/60 dark:text-amber-100">
                {collection.countdownLabel}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-xl text-sm text-text-muted">
            {collection.description}
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {recipes.map((r) => (
          <li key={r.id}>
            <Link
              href={`/tarif/${r.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-amber-200/50 bg-white/60 transition hover:border-amber-400 hover:shadow-md dark:border-amber-500/20 dark:bg-gray-900/50 dark:hover:border-amber-500/60"
            >
              <div className="flex h-20 w-full items-center justify-center bg-amber-100/40 dark:bg-amber-900/30 sm:h-24">
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl" aria-hidden>
                    {r.emoji ?? "🍽️"}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-2.5">
                <p className="line-clamp-2 text-xs font-medium leading-tight text-text transition-colors group-hover:text-primary sm:text-sm">
                  {r.title}
                </p>
                <p className="mt-auto text-[10px] text-text-muted">
                  ⏱ {r.totalMinutes} {tHome("minutes")}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
