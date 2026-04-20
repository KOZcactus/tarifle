import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import {
  getRecipeReviews,
  getUserReviewForRecipe,
  type RecipeReviewSummary,
} from "@/lib/queries/recipe";
import { isValidLocale } from "@/i18n/config";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { DeleteOwnReviewButton } from "./DeleteOwnReviewButton";
import { ReportButton } from "./ReportButton";

interface ReviewsSectionProps {
  recipeId: string;
  recipeSlug: string;
}

type RelativeT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

function formatRelative(iso: string, t: RelativeT, locale: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t("justNow");
  if (min < 60) return t("minutesAgo", { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("hoursAgo", { n: hr });
  const d = Math.floor(hr / 24);
  if (d < 7) return t("daysAgo", { n: d });
  return new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DistributionBars({ summary }: { summary: RecipeReviewSummary }) {
  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((n) => {
        const count = summary.distribution[n as 1 | 2 | 3 | 4 | 5];
        const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
        return (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right tabular-nums text-gray-600 dark:text-gray-400">
              {n}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div
                className="h-full bg-[#f5a623] transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right tabular-nums text-gray-600 dark:text-gray-400">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export async function ReviewsSection({
  recipeId,
  recipeSlug,
}: ReviewsSectionProps) {
  const [session, t, tRelative, localeRaw] = await Promise.all([
    auth(),
    getTranslations("reviews"),
    getTranslations("reviews.relative"),
    getLocale(),
  ]);
  const userId = session?.user?.id ?? null;
  const locale = isValidLocale(localeRaw) ? localeRaw : "tr";

  const [{ reviews, summary }, userReview] = await Promise.all([
    getRecipeReviews(recipeId),
    userId ? getUserReviewForRecipe(userId, recipeId) : Promise.resolve(null),
  ]);

  return (
    <section aria-labelledby="reviews-heading" className="mt-10">
      <h2
        id="reviews-heading"
        className="mb-4 text-xl font-semibold md:text-2xl"
      >
        {t("sectionTitle", { count: summary.count })}
      </h2>

      {/* Summary card */}
      {summary.count > 0 && (
        <div className="mb-6 flex flex-col gap-6 rounded-xl border border-black/5 bg-white p-5 shadow-sm md:flex-row md:items-center dark:border-white/5 dark:bg-gray-900">
          <div className="flex flex-col items-center md:items-start">
            <div className="text-4xl font-bold tabular-nums">
              {summary.average.toFixed(1)}
            </div>
            <StarRating value={summary.average} size="md" />
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t("reviewCount", { count: summary.count })}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <DistributionBars summary={summary} />
          </div>
        </div>
      )}

      {/* Form / login prompt */}
      {userId ? (
        <div className="mb-6">
          <ReviewForm recipeId={recipeId} existing={userReview} />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-black/10 bg-white/50 p-5 text-center dark:border-white/10 dark:bg-gray-900/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.rich("loginPrompt", {
              link: (chunks) => (
                <Link
                  href={`/giris?callbackUrl=/tarif/${recipeSlug}`}
                  className="font-medium text-primary hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-gray-900"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/profil/${r.author.username}`}
                    className="shrink-0"
                  >
                    {r.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.author.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                        {(r.author.name ?? r.author.username)
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/profil/${r.author.username}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {r.author.name ?? r.author.username}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} size="sm" />
                      <span className="text-xs text-gray-500">
                        {formatRelative(r.createdAt, tRelative, locale)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {userId && userReview?.id === r.id ? (
                    <DeleteOwnReviewButton reviewId={r.id} />
                  ) : userId ? (
                    // Rapor butonu yalnız başkalarının yorumu için
                    //, kullanıcı kendi yorumunu raporlamaz, düzenler/siler.
                    <ReportButton targetType="REVIEW" targetId={r.id} />
                  ) : null}
                </div>
              </div>
              {r.comment && (
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {r.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
