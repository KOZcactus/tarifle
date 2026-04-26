import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAllergenConfidence } from "@/lib/recipe/allergen-confidence";

/**
 * /admin/kalite, tarif kalite dashboard.
 *
 * Editör paneli için "şu 30-50 tarifi rafine et" listesi. Mevcut audit
 * scriptlerinin (audit-deep, content:validate, find-allergen-mismatch)
 * UI hâli, tek pass'te öncelik sırasıyla en zayıf tarifleri gösterir.
 *
 * Skorlama (yüksek puan = düşük kalite, listenin başında):
 *   - description < 50 char: +20
 *   - tipNote null: +10
 *   - servingSuggestion null: +10
 *   - description en az kelime sayısı: ortanca altı +5
 *   - step < min(type): +20
 *   - allergen extraInferred (kaçırılan tag): +15 / her tag
 *   - allergen extraDeclared (false-positive): +3 / her tag
 *
 * Tek metric değil, "kalite zayıflığı" composite. Editör en kritik
 * tarifleri üstten alır, refine eder.
 */

const MIN_STEPS_BY_TYPE: Record<string, number> = {
  YEMEK: 5,
  CORBA: 5,
  SALATA: 5,
  TATLI: 5,
  KAHVALTI: 5,
  ATISTIRMALIK: 4,
  APERATIF: 4,
  KOKTEYL: 4,
  ICECEK: 3,
  SOS: 3,
};

interface QualityIssue {
  code: string;
  weight: number;
  detail?: string;
}

interface RecipeQuality {
  id: string;
  slug: string;
  title: string;
  type: string;
  cuisine: string | null;
  totalScore: number;
  issues: QualityIssue[];
}

const PAGE_SIZE = 50;

export default async function AdminQualityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  const t = await getTranslations("admin.quality");

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      cuisine: true,
      description: true,
      tipNote: true,
      servingSuggestion: true,
      allergens: true,
      _count: { select: { steps: true } },
      ingredients: { select: { name: true } },
    },
  });

  const scored: RecipeQuality[] = recipes.map((r) => {
    const issues: QualityIssue[] = [];

    if (r.description.length < 50) {
      issues.push({
        code: "shortDescription",
        weight: 20,
        detail: `${r.description.length} char`,
      });
    } else if (r.description.split(/\s+/).length < 12) {
      issues.push({
        code: "fewWords",
        weight: 5,
      });
    }

    if (!r.tipNote || r.tipNote.length < 8) {
      issues.push({ code: "missingTip", weight: 10 });
    }
    if (!r.servingSuggestion || r.servingSuggestion.length < 8) {
      issues.push({ code: "missingServing", weight: 10 });
    }

    const minSteps = MIN_STEPS_BY_TYPE[r.type] ?? 4;
    if (r._count.steps < minSteps) {
      issues.push({
        code: "shortSteps",
        weight: 20,
        detail: `${r._count.steps} / ${minSteps}`,
      });
    }

    const confidence = computeAllergenConfidence(r.allergens, r.ingredients);
    if (confidence.extraInferred.length > 0) {
      issues.push({
        code: "missingAllergenTag",
        weight: 15 * confidence.extraInferred.length,
        detail: confidence.extraInferred.join(", "),
      });
    }
    if (confidence.extraDeclared.length > 0) {
      issues.push({
        code: "extraDeclaredAllergen",
        weight: 3 * confidence.extraDeclared.length,
        detail: confidence.extraDeclared.join(", "),
      });
    }

    const totalScore = issues.reduce((s, i) => s + i.weight, 0);
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      type: r.type,
      cuisine: r.cuisine,
      totalScore,
      issues,
    };
  });

  const ranked = scored
    .filter((r) => r.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, PAGE_SIZE);

  const totalIssues = scored.filter((r) => r.totalScore > 0).length;

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-heading text-xl font-bold">{t("heading")}</h2>
        <p className="mt-2 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("totalRecipes")} value={recipes.length} />
        <Stat label={t("withIssues")} value={totalIssues} />
        <Stat label={t("listedTop")} value={ranked.length} />
        <Stat
          label={t("highestScore")}
          value={ranked[0]?.totalScore ?? 0}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-xs text-text-muted">
            <tr>
              <th className="px-4 py-3 text-left">{t("colTitle")}</th>
              <th className="px-4 py-3 text-left">{t("colType")}</th>
              <th className="px-4 py-3 text-left">{t("colIssues")}</th>
              <th className="px-4 py-3 text-right">{t("colScore")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ranked.map((r) => (
              <tr key={r.id} className="hover:bg-bg-elevated/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/tarif/${r.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-text-muted">{r.cuisine}</p>
                </td>
                <td className="px-4 py-3 align-top text-xs text-text-muted">
                  {r.type}
                </td>
                <td className="px-4 py-3 align-top">
                  <ul className="space-y-0.5 text-xs">
                    {r.issues.map((iss, i) => (
                      <li key={i} className="text-text-muted">
                        <span className="font-medium text-text">
                          {t(`issue.${iss.code}`)}
                        </span>
                        {iss.detail && (
                          <span className="ml-1 text-text-muted">
                            ({iss.detail})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 text-right align-top font-mono text-sm font-semibold">
                  {r.totalScore}
                </td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  {t("emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}
