import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getVariationById } from "@/lib/queries/variation";
import { ShareMenu } from "@/components/recipe/ShareMenu";
import { SITE_URL } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  const variation = await getVariationById(id, session?.user?.id ?? null);
  if (!variation) return { title: "Uyarlama bulunamadı | Tarifle" };

  const title = `${variation.miniTitle} — ${variation.recipe.title} uyarlaması`;
  const authorLabel = variation.author.name ?? `@${variation.author.username}`;
  const description =
    variation.description?.slice(0, 200) ||
    `${authorLabel}'ın ${variation.recipe.title} tarifine getirdiği uyarlama.`;

  return {
    title,
    description,
    alternates: { canonical: `/uyarlama/${variation.id}` },
    robots:
      variation.status === "PUBLISHED"
        ? undefined
        : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/uyarlama/${variation.id}`,
      authors: [authorLabel],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * `/uyarlama/[id]` — tek uyarlamanın permalink'i + paylaşım yüzü.
 *
 * Tarif detay sayfasındaki uzun akışın küçük bir çıkarımı: header,
 * author + tarife geri dönüş linki, miniTitle, description, notes,
 * ingredients listesi + adımlar, paylaş butonu. Alttan büyük CTA
 * tarif sayfasına götürüyor — izleyici uyarlamayı okuduktan sonra
 * asıl tarifle buluşuyor.
 */
export default async function VariationPermalinkPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const [variation, t, tRecipe] = await Promise.all([
    getVariationById(id, session?.user?.id ?? null),
    getTranslations("variation"),
    getTranslations("recipe"),
  ]);

  if (!variation) notFound();

  const authorLabel = variation.author.name ?? `@${variation.author.username}`;
  const ingredients = normalizeList(variation.ingredients);
  const steps = normalizeList(variation.steps);
  const shareText = `${variation.miniTitle} — ${variation.recipe.title} uyarlaması`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-4 text-xs text-text-muted">
        <Link
          href={`/tarif/${variation.recipe.slug}`}
          className="hover:text-primary"
        >
          ← {t("backToRecipe", { title: variation.recipe.title })}
        </Link>
      </nav>

      <header className="mb-6 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
          {t("permalinkEyebrow")}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
          {variation.recipe.emoji && (
            <span className="mr-2" aria-hidden="true">
              {variation.recipe.emoji}
            </span>
          )}
          {variation.miniTitle}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {t("byAuthorForRecipe", {
            author: authorLabel,
            recipe: variation.recipe.title,
          })}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <Link
            href={`/profil/${variation.author.username}`}
            className="hover:text-primary"
          >
            @{variation.author.username}
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={variation.createdAt.toISOString()}>
            {new Date(variation.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          {variation.likeCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>❤️ {variation.likeCount}</span>
            </>
          )}
        </div>

        {variation.status === "PUBLISHED" && (
          <div className="mt-4">
            <ShareMenu
              title={shareText}
              url={`${SITE_URL}/uyarlama/${variation.id}`}
              text={
                variation.description?.slice(0, 160) ||
                `${authorLabel} — ${variation.recipe.title} uyarlaması`
              }
              imageUrl={`${SITE_URL}/uyarlama/${variation.id}/opengraph-image`}
            />
          </div>
        )}
      </header>

      {variation.description && (
        <section className="mb-6 rounded-xl border border-border bg-bg-card p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {variation.description}
          </p>
        </section>
      )}

      {ingredients.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            {t("ingredientsHeading")}
          </h2>
          <ul className="space-y-1.5 text-sm text-text">
            {ingredients.map((line, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-text-muted" aria-hidden="true">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            {t("stepsHeading")}
          </h2>
          <ol className="space-y-2.5 text-sm text-text">
            {steps.map((line, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="shrink-0 font-semibold text-primary">
                  {idx + 1}.
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {variation.notes && (
        <section className="mb-6 rounded-xl border border-dashed border-border bg-bg-card/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("notesHeading")}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-text">
            {variation.notes}
          </p>
        </section>
      )}

      <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
        <p className="text-sm text-text-muted">
          {t("ctaLead", { recipe: variation.recipe.title })}
        </p>
        <Link
          href={`/tarif/${variation.recipe.slug}`}
          className="mt-3 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {tRecipe("breadcrumbAria") /* fallback neutral */ ? null : null}
          {t("ctaButton")}
        </Link>
      </div>
    </main>
  );
}

/**
 * Variation ingredients/steps JSONB bucket — Prisma `Json` döndürür;
 * seed formatında basit string array, kullanıcı entry'lerinde de
 * "line 1\nline 2" tek string bazen. Her iki şekli sade string[]'e
 * çeviriyoruz.
 */
function normalizeList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((r) => (typeof r === "string" ? r : JSON.stringify(r)))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
