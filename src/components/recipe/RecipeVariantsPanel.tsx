import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { RecipeVariant } from "@/lib/queries/recipe-variants";

interface Props {
  simpler: RecipeVariant | null;
  fancier: RecipeVariant | null;
}

/**
 * "Bu tarifi basitleştir / lüksleştir" yan panel. Tarif detayının
 * altında, mevcut kategoride daha az / daha çok malzeme-adım içeren
 * bir alternatif öneriyor. Rule-based, cache'li (recipe-variants-v1
 * tag'i 30 dk TTL, recipe invalidation ile yenilenir).
 *
 * Tasarım: iki kartlık yatay grid, her kart kısa özet + CTA. Hiç
 * alternatif yoksa panel render etmez (anchor kategoride tek başına).
 */
export async function RecipeVariantsPanel({ simpler, fancier }: Props) {
  if (!simpler && !fancier) return null;
  const t = await getTranslations("recipeVariants");

  return (
    <section
      aria-label={t("heading")}
      className="rounded-xl border border-border bg-bg-card p-4 sm:p-5"
    >
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-text">{t("heading")}</h2>
        <p className="mt-0.5 text-sm text-text-muted">{t("hint")}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {simpler && (
          <VariantCard
            href={`/tarif/${simpler.slug}`}
            icon="🔄"
            label={t("simplerLabel")}
            summary={t("simplerSummary", {
              steps: simpler.stepCount,
              ingredients: simpler.ingredientCount,
              minutes: simpler.totalMinutes,
            })}
            recipe={simpler}
            cta={t("cta")}
          />
        )}
        {fancier && (
          <VariantCard
            href={`/tarif/${fancier.slug}`}
            icon="✨"
            label={t("fancierLabel")}
            summary={t("fancierSummary", {
              steps: fancier.stepCount,
              ingredients: fancier.ingredientCount,
              minutes: fancier.totalMinutes,
            })}
            recipe={fancier}
            cta={t("cta")}
          />
        )}
      </div>
    </section>
  );
}

interface VariantCardProps {
  href: string;
  icon: string;
  label: string;
  summary: string;
  cta: string;
  recipe: RecipeVariant;
}

function VariantCard({
  href,
  icon,
  label,
  summary,
  cta,
  recipe,
}: VariantCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-bg p-3 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <h3 className="font-semibold text-text">
        {recipe.emoji && (
          <span aria-hidden className="mr-1">
            {recipe.emoji}
          </span>
        )}
        {recipe.title}
      </h3>
      <p className="text-xs text-text-muted">{summary}</p>
      <span className="mt-auto text-xs font-medium text-primary group-hover:underline">
        {cta} →
      </span>
    </Link>
  );
}
