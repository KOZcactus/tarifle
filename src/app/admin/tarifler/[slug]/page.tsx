import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRecipeDetail } from "@/lib/queries/admin";
import { getDifficultyLabel } from "@/lib/utils";
import { CUISINE_LABEL, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";
import { FLAG_LABELS, type PreflightFlag } from "@/lib/moderation/preflight";
import {
  REVIEW_FLAG_LABELS,
  type ReviewPreflightFlag,
} from "@/lib/moderation/preflight-review";
import {
  InlineRecipeText,
  InlineRecipeStatus,
  InlineRecipeFeatured,
} from "@/components/admin/InlineRecipeEdit";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `${slug} | Yönetim Paneli`,
    robots: { index: false, follow: false },
  };
}

function statusChip(status: string) {
  if (status === "PUBLISHED") {
    return { label: "Yayında", classes: "bg-accent-green/15 text-accent-green" };
  }
  if (status === "HIDDEN" || status === "REJECTED") {
    return { label: status, classes: "bg-error/15 text-error" };
  }
  if (status === "PENDING_REVIEW") {
    return { label: "İncelemede", classes: "bg-secondary/20 text-secondary" };
  }
  return { label: status, classes: "bg-bg-elevated text-text-muted" };
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminRecipeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getAdminRecipeDetail(slug);
  if (!detail) notFound();

  const {
    recipe,
    reviews,
    variations,
    reviewCount,
    reviewAverage,
    ratingDistribution,
    topBookmarkers,
  } = detail;

  const cuisineLabel = recipe.cuisine
    ? CUISINE_LABEL[recipe.cuisine as CuisineCode] ?? recipe.cuisine
    : null;
  const cuisineFlag = recipe.cuisine
    ? CUISINE_FLAG[recipe.cuisine as CuisineCode] ?? "🌍"
    : null;

  const stats = [
    { label: "Görüntülenme", value: recipe.viewCount, emoji: "👁" },
    { label: "Uyarlama", value: recipe._count.variations, emoji: "🔄" },
    { label: "Yorum", value: recipe._count.reviews, emoji: "⭐" },
    { label: "Kayıt", value: recipe._count.bookmarks, emoji: "🔖" },
    { label: "Malzeme", value: recipe._count.ingredients, emoji: "🧂" },
    { label: "Adım", value: recipe._count.steps, emoji: "📝" },
  ];

  const totalDistribution = Object.values(ratingDistribution).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-text-muted" aria-label="breadcrumb">
        <Link href="/admin/tarifler" className="hover:text-primary">
          Tarifler
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-text">{recipe.slug}</span>
      </nav>

      {/* Header */}
      <header className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-heading text-xl font-bold text-text">
                <InlineRecipeText
                  recipeId={recipe.id}
                  field="emoji"
                  value={recipe.emoji ?? ""}
                  label="Emoji"
                  maxLength={8}
                />{" "}
                <InlineRecipeText
                  recipeId={recipe.id}
                  field="title"
                  value={recipe.title}
                  label="Başlık"
                />
              </h2>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <InlineRecipeStatus recipeId={recipe.id} value={recipe.status} />
              <InlineRecipeFeatured recipeId={recipe.id} value={recipe.isFeatured} />
            </div>
            <div className="mt-3 text-sm text-text-muted">
              <InlineRecipeText
                recipeId={recipe.id}
                field="description"
                value={recipe.description ?? ""}
                multiline
                label="Açıklama"
                maxLength={1000}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
              <span>
                {recipe.category.emoji} {recipe.category.name}
              </span>
              {cuisineLabel && (
                <span>
                  {cuisineFlag} {cuisineLabel}
                </span>
              )}
              <span>Zorluk: {getDifficultyLabel(recipe.difficulty)}</span>
              <span>Tip: {recipe.type}</span>
              <span>Eklendi: {fmtDate(recipe.createdAt)}</span>
              <span>Güncellendi: {fmtDate(recipe.updatedAt)}</span>
            </div>
            {recipe.allergens.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {recipe.allergens.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-medium text-error"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link
            href={`/tarif/${recipe.slug}`}
            target="_blank"
            rel="noopener"
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-bg-elevated"
          >
            Public sayfa ↗
          </Link>
        </div>
      </header>

      {/* Stats grid */}
      <section>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-bg-card px-3 py-3"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-lg">
                  {s.emoji}
                </span>
                <div>
                  <p className="text-lg font-bold text-text">
                    {s.value.toLocaleString("tr-TR")}
                  </p>
                  <p className="text-[11px] text-text-muted">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nutrition */}
      {recipe.averageCalories !== null && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold">
            🥗 Beslenme
          </h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-bg-card p-3">
              <p className="text-lg font-bold text-text">
                {recipe.averageCalories}
              </p>
              <p className="text-[11px] text-text-muted">kalori / porsiyon</p>
            </div>
            {recipe.protein !== null && (
              <div className="rounded-xl border border-border bg-bg-card p-3">
                <p className="text-lg font-bold text-text">
                  {recipe.protein.toString()}g
                </p>
                <p className="text-[11px] text-text-muted">Protein</p>
              </div>
            )}
            {recipe.carbs !== null && (
              <div className="rounded-xl border border-border bg-bg-card p-3">
                <p className="text-lg font-bold text-text">
                  {recipe.carbs.toString()}g
                </p>
                <p className="text-[11px] text-text-muted">Karbonhidrat</p>
              </div>
            )}
            {recipe.fat !== null && (
              <div className="rounded-xl border border-border bg-bg-card p-3">
                <p className="text-lg font-bold text-text">
                  {recipe.fat.toString()}g
                </p>
                <p className="text-[11px] text-text-muted">Yağ</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Rating aggregate + distribution */}
      {reviewCount > 0 && reviewAverage !== null && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold">
            ⭐ Yıldız özeti
          </h3>
          <div className="grid gap-4 rounded-xl border border-border bg-bg-card p-5 md:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
              <p className="text-4xl font-bold tabular-nums text-text">
                {reviewAverage}
              </p>
              <p className="mt-1 text-[#f5a623]">
                {"★".repeat(Math.round(reviewAverage))}
                <span className="text-text-muted">
                  {"★".repeat(5 - Math.round(reviewAverage))}
                </span>
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {reviewCount} yayındaki yorum
              </p>
            </div>
            <ul className="flex flex-col justify-center gap-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = ratingDistribution[n as 1 | 2 | 3 | 4 | 5];
                const pct =
                  totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                return (
                  <li
                    key={n}
                    className="grid grid-cols-[40px_1fr_60px] items-center gap-3 text-sm"
                  >
                    <span className="text-[#f5a623]">
                      {n}★
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className="h-full bg-[#f5a623] transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums text-text-muted">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          ⭐ Yorumlar ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz yorum yok.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
            <ul className="divide-y divide-border">
              {reviews.map((r) => {
                const chipInfo = statusChip(r.status);
                const flags = (r.moderationFlags ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as ReviewPreflightFlag[];
                return (
                  <li key={r.id} className="flex flex-col gap-1 px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-[#f5a623]">
                        {"★".repeat(r.rating)}
                        <span className="text-text-muted">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </span>
                      <Link
                        href={`/admin/kullanicilar/${r.user.username ?? ""}`}
                        className="min-w-0 flex-1 truncate text-xs text-text hover:text-primary"
                      >
                        {r.user.name ?? `@${r.user.username ?? "—"}`}
                      </Link>
                      <span className="shrink-0 text-xs text-text-muted">
                        {fmtDate(r.createdAt)}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${chipInfo.classes}`}
                      >
                        {chipInfo.label}
                      </span>
                    </div>
                    {r.comment && (
                      <blockquote className="border-l-2 border-border pl-2 text-xs text-text">
                        {r.comment}
                      </blockquote>
                    )}
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {flags.map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] text-error"
                          >
                            {REVIEW_FLAG_LABELS[f] ?? f}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.status === "HIDDEN" && r.hiddenReason && (
                      <p className="text-[11px] italic text-text-muted">
                        Gizleme sebebi: {r.hiddenReason}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Variations */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          🔄 Uyarlamalar ({variations.length})
        </h3>
        {variations.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz uyarlama yok.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
            <ul className="divide-y divide-border">
              {variations.map((v) => {
                const chipInfo = statusChip(v.status);
                const flags = (v.moderationFlags ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as PreflightFlag[];
                return (
                  <li key={v.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">
                        {v.miniTitle}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        <Link
                          href={`/admin/kullanicilar/${v.author.username ?? ""}`}
                          className="hover:text-primary"
                        >
                          {v.author.name ?? `@${v.author.username ?? "—"}`}
                        </Link>
                        {" · "}
                        {fmtDate(v.createdAt)}
                      </p>
                      {flags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {flags.map((f) => (
                            <span
                              key={f}
                              className="rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] text-error"
                            >
                              {FLAG_LABELS[f] ?? f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span title="Beğeni" className="text-text-muted">
                        ❤ {v.likeCount}
                      </span>
                      {v.reportCount > 0 && (
                        <span className="rounded-full bg-error/15 px-1.5 py-0.5 text-[10px] font-medium text-error">
                          🚩 {v.reportCount}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${chipInfo.classes}`}
                      >
                        {chipInfo.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Recent bookmarkers */}
      {topBookmarkers.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold">
            🔖 Son kaydedenler
          </h3>
          <ul className="divide-y divide-border rounded-xl border border-border bg-bg-card">
            {topBookmarkers.map((b, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-2 text-sm"
              >
                <Link
                  href={`/admin/kullanicilar/${b.user.username ?? ""}`}
                  className="flex-1 truncate text-text hover:text-primary"
                >
                  {b.user.name ?? `@${b.user.username ?? "—"}`}
                </Link>
                <span className="shrink-0 text-xs text-text-muted">
                  {fmtDate(b.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
