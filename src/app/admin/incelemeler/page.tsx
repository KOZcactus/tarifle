import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FLAG_LABELS, type PreflightFlag } from "@/lib/moderation/preflight";
import { formatIngredient, normaliseIngredients } from "@/lib/ingredients";
import { ReviewActions } from "@/components/admin/ReviewActions";

export const metadata: Metadata = {
  title: "İncelemeler — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const variations = await prisma.variation.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, username: true } },
      recipe: { select: { slug: true, title: true } },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-heading text-xl font-semibold">İncelemeler</h2>
        <p className="mt-1 text-sm text-text-muted">
          Kural tabanlı ön kontrol tarafından işaretlenen ve insan gözü bekleyen
          uyarlamalar. Onayladığın yayına geçer, gizlediğin arşive alınır.
        </p>
      </header>

      {variations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-text-muted">
            İnceleme kuyruğu şu an boş. Yeni bir uyarlama işaretlenirse burada
            görünür.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {variations.map((v) => {
            const flagCodes = (v.moderationFlags ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean) as PreflightFlag[];

            return (
              <li
                key={v.id}
                className="rounded-xl border border-border bg-bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-heading text-base font-semibold text-text">
                        {v.miniTitle}
                      </h3>
                      <span className="text-xs text-text-muted">
                        · {v.author.name ?? v.author.username ?? "Anonim"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      Tarif:{" "}
                      <Link
                        href={`/tarif/${v.recipe.slug}`}
                        className="text-primary hover:text-primary-hover"
                      >
                        {v.recipe.title}
                      </Link>
                      {" · "}
                      {new Date(v.createdAt).toLocaleString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <ReviewActions
                    variationId={v.id}
                    recipeSlug={v.recipe.slug}
                  />
                </div>

                {v.description && (
                  <p className="mt-3 text-sm text-text-muted">{v.description}</p>
                )}

                {/* Flag chips */}
                {flagCodes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {flagCodes.map((code) => (
                      <span
                        key={code}
                        className="rounded-full bg-error/10 px-2 py-0.5 text-[11px] font-medium text-error"
                      >
                        {FLAG_LABELS[code] ?? code}
                      </span>
                    ))}
                  </div>
                )}

                {(() => {
                  const ingredientLines = normaliseIngredients(
                    v.ingredients,
                  ).map(formatIngredient);
                  const stepLines = Array.isArray(v.steps)
                    ? (v.steps as unknown[]).map(String)
                    : [];
                  return (
                    /* Collapsed content preview */
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-text-muted hover:text-text">
                        İçeriği göster ({ingredientLines.length} malzeme,{" "}
                        {stepLines.length} adım)
                      </summary>
                      <div className="mt-3 space-y-3 rounded-lg bg-bg-elevated p-3 text-sm">
                        <section>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                            Malzemeler
                          </p>
                          <ul className="list-inside list-disc space-y-0.5 text-text">
                            {ingredientLines.map((line, i) => (
                              <li key={i}>{line}</li>
                            ))}
                          </ul>
                        </section>
                        <section>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                            Adımlar
                          </p>
                          <ol className="list-inside list-decimal space-y-0.5 text-text">
                            {stepLines.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </section>
                        {v.notes && (
                          <section>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                              Notlar
                            </p>
                            <p className="text-text">{v.notes}</p>
                          </section>
                        )}
                      </div>
                    </details>
                  );
                })()}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
