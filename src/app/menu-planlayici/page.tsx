import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import {
  DAYS_OF_WEEK,
  MEAL_TYPES,
  getActiveMealPlan,
  getDemoMealPlanRecipes,
  getMondayOfWeek,
  indexMealPlanItems,
} from "@/lib/queries/meal-plan";
import { MealSlot } from "@/components/meal-plan/MealSlot";
import { AddToShoppingListButton } from "@/components/meal-plan/AddToShoppingListButton";
import { PrintButton } from "@/components/meal-plan/PrintButton";
import { DemoMealPlanGrid } from "@/components/meal-plan/DemoMealPlanGrid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.mealPlanner");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/menu-planlayici" },
    // Login yoksa demo preview serve ediliyor; Google bot demo'yu
    // indexleyebilir cunku zengin icerik + CTA sinyali var. Ancak
    // interactive planner login-gated oldugu icin private index sinyali
    // istemiyoruz; authenticated state'te de robots noindex yararli
    // (kullaniciya ozel, search context'te anlamsiz). noindex + follow
    // korundu, internal link crawl devam eder.
    robots: { index: false, follow: true },
  };
}

export const dynamic = "force-dynamic";

export default async function MenuPlanlayiciPage() {
  const session = await auth();

  // Login yoksa demo preview render et; GPT audit'inin "login oncesi
  // kisa bir demo, ornek haftalik menu gosterilirse kullanici neden
  // uye olmasi gerektigini daha iyi anlar" onerisi.
  if (!session?.user?.id) {
    const [demoRecipes, t, tMeal, tDemo] = await Promise.all([
      getDemoMealPlanRecipes(),
      getTranslations("mealPlanner"),
      getTranslations("mealPlanner.meal"),
      getTranslations("mealPlanner.demo"),
    ]);
    void tDemo;
    const dayLabels = [
      t("days.monday"),
      t("days.tuesday"),
      t("days.wednesday"),
      t("days.thursday"),
      t("days.friday"),
      t("days.saturday"),
      t("days.sunday"),
    ];
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-text-muted">{t("subtitle")}</p>
        </header>
        <DemoMealPlanGrid
          recipes={demoRecipes}
          dayLabels={dayLabels}
          mealLabels={{
            BREAKFAST: tMeal("breakfast"),
            LUNCH: tMeal("lunch"),
            DINNER: tMeal("dinner"),
          }}
        />
      </main>
    );
  }

  const [plan, t, tMeal] = await Promise.all([
    getActiveMealPlan(session.user.id),
    getTranslations("mealPlanner"),
    getTranslations("mealPlanner.meal"),
  ]);

  const items = plan?.items ?? [];
  const byCell = indexMealPlanItems(items);
  const monday = plan?.weekStart ?? getMondayOfWeek();
  const weekRange = formatWeekRange(monday);

  const dayLabels = [
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
    t("days.sunday"),
  ];
  const mealLabels: Record<string, string> = {
    BREAKFAST: tMeal("breakfast"),
    LUNCH: tMeal("lunch"),
    DINNER: tMeal("dinner"),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 print:mb-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("pageTitle")}</h1>
          <p className="mt-2 text-sm text-text-muted">{t("subtitle")}</p>
          <p className="mt-1 text-xs tabular-nums text-text-muted">
            {t("weekRangeLabel")} {weekRange}
          </p>
        </div>

        {/* Sağ üst toolbar, print gizli olur, sadece ekranda */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PrintButton label={t("printLabel")} />
          <AddToShoppingListButton slotCount={items.length} />
        </div>
      </header>

      {/* Grid, mobilde list, md+'da 7-col grid. Header row'unda günler
          + mealType kolonu, her cell MealSlot. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs uppercase tracking-wide text-text-muted">
                {t("mealColumnHeader")}
              </th>
              {DAYS_OF_WEEK.map((d) => (
                <th
                  key={d}
                  className="p-2 text-left text-xs font-semibold text-text"
                >
                  {dayLabels[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map((meal) => (
              <tr key={meal}>
                <th className="w-28 p-2 text-left text-xs font-semibold text-text">
                  {mealLabels[meal]}
                </th>
                {DAYS_OF_WEEK.map((day) => {
                  const cell = byCell.get(`${day}:${meal}`);
                  return (
                    <td key={day} className="p-1 align-top">
                      <MealSlot
                        dayOfWeek={day}
                        mealType={meal}
                        recipe={
                          cell?.recipe
                            ? {
                                id: cell.recipe.id,
                                title: cell.recipe.title,
                                slug: cell.recipe.slug,
                                emoji: cell.recipe.emoji,
                                totalMinutes: cell.recipe.totalMinutes,
                              }
                            : null
                        }
                        slotLabel={`${dayLabels[day]} · ${mealLabels[meal]}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobil, gün bazlı kart dizisi */}
      <div className="space-y-4 md:hidden">
        {DAYS_OF_WEEK.map((day) => (
          <section
            key={day}
            className="rounded-xl border border-border bg-bg-card p-3"
          >
            <h2 className="mb-2 font-heading text-sm font-semibold">
              {dayLabels[day]}
            </h2>
            <div className="space-y-2">
              {MEAL_TYPES.map((meal) => {
                const cell = byCell.get(`${day}:${meal}`);
                return (
                  <div key={meal}>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-text-muted">
                      {mealLabels[meal]}
                    </p>
                    <MealSlot
                      dayOfWeek={day}
                      mealType={meal}
                      recipe={
                        cell?.recipe
                          ? {
                              id: cell.recipe.id,
                              title: cell.recipe.title,
                              slug: cell.recipe.slug,
                              emoji: cell.recipe.emoji,
                              totalMinutes: cell.recipe.totalMinutes,
                            }
                          : null
                      }
                      slotLabel={`${dayLabels[day]} · ${mealLabels[meal]}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Empty hint, tüm slot'lar boşsa */}
      {items.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-border p-4 text-center text-sm text-text-muted">
          {t("emptyHint")}
        </p>
      )}
    </div>
  );
}

/** Pazartesi-Pazar range'i kısa form ("14 Nisan – 20 Nisan 2026"). */
function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  });
  const fmtFull = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${fmt.format(monday)} – ${fmtFull.format(sunday)}`;
}

