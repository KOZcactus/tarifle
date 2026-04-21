import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface DemoRecipe {
  id: string;
  title: string;
  slug: string;
  emoji: string | null;
  totalMinutes: number;
}

interface DemoMealPlanGridProps {
  /** 21 recipe (7 day x 3 meal). Sirali: [mon-breakfast, mon-lunch,
   *  mon-dinner, tue-breakfast, ...]. Caller meal-type filter ile
   *  sampled provide eder. */
  recipes: (DemoRecipe | null)[];
  dayLabels: string[];
  mealLabels: {
    BREAKFAST: string;
    LUNCH: string;
    DINNER: string;
  };
}

/**
 * Giris yapmamis ziyaretciler icin Menu Planlayici read-only preview.
 * Login wall'i kaldirmadan, onceden once kullanici neyin alacagini
 * gostermek icin. GPT audit: "login oncesi kisa bir demo, ornek
 * haftalik menu veya 'bugunun menusunu olustur' onizlemesi gosterilirse
 * kullanici neden uye olmasi gerektigini daha iyi anlar".
 *
 * Interaktif degil: slot'lar recipe detay'ina link, add/clear yok.
 * Turqet: kullanici 'peki giris yaparsam ne olabilir' gorsun.
 */
export async function DemoMealPlanGrid({
  recipes,
  dayLabels,
  mealLabels,
}: DemoMealPlanGridProps) {
  const t = await getTranslations("mealPlanner.demo");

  const mealTypes: Array<"BREAKFAST" | "LUNCH" | "DINNER"> = [
    "BREAKFAST",
    "LUNCH",
    "DINNER",
  ];

  return (
    <div className="space-y-6">
      {/* Demo banner + CTA */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-3xl">
              🗓️
            </span>
            <div>
              <p className="font-heading text-lg font-bold text-text">
                {t("bannerTitle")}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {t("bannerSubtitle")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              href="/kayit?next=/menu-planlayici"
              className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {t("signupCta")}
            </Link>
            <Link
              href="/giris?next=/menu-planlayici"
              className="rounded-lg border border-border bg-bg-card px-4 py-2 text-center text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
            >
              {t("loginCta")}
            </Link>
          </div>
        </div>
      </div>

      {/* 7 day x 3 meal demo grid */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-8 gap-2">
          {/* Header row */}
          <div className="" aria-hidden="true" />
          {dayLabels.map((day) => (
            <div
              key={day}
              className="px-2 py-1 text-center text-xs font-semibold text-text-muted"
            >
              {day}
            </div>
          ))}

          {/* 3 meal rows */}
          {mealTypes.map((mealType, mealIdx) => (
            <div key={mealType} className="contents">
              <div className="flex items-center px-2 text-xs font-semibold text-text-muted">
                {mealLabels[mealType]}
              </div>
              {dayLabels.map((_, dayIdx) => {
                const recipe = recipes[dayIdx * 3 + mealIdx];
                if (!recipe) {
                  return (
                    <div
                      key={`${mealType}-${dayIdx}`}
                      className="min-h-[5.5rem] rounded-lg border border-dashed border-border bg-bg-elevated/30"
                      aria-label={t("emptySlot")}
                    />
                  );
                }
                return (
                  <Link
                    key={`${mealType}-${dayIdx}`}
                    href={`/tarif/${recipe.slug}`}
                    className="group flex min-h-[5.5rem] flex-col justify-between rounded-lg border border-border bg-bg-card p-2 transition-all hover:border-primary hover:shadow-sm"
                  >
                    <div className="flex items-start gap-1.5">
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-lg"
                      >
                        {recipe.emoji ?? "🍽️"}
                      </span>
                      <span className="line-clamp-2 text-xs font-medium text-text group-hover:text-primary">
                        {recipe.title}
                      </span>
                    </div>
                    <span className="mt-1 text-[10px] text-text-muted">
                      {recipe.totalMinutes} dk
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-text-muted">
        {t("footerHint")}
      </p>
    </div>
  );
}
