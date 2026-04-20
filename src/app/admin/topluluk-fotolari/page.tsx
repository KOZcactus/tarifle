import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { isUserPhotosEnabled } from "@/lib/site-settings";
import { UserPhotosFeatureToggle } from "@/components/admin/UserPhotosFeatureToggle";
import { AdminPhotoCard } from "@/components/admin/AdminPhotoCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.userPhotos");
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

/**
 * Admin moderasyon sayfası, /admin/topluluk-fotolari.
 *
 * - Üstte feature flag toggle (on/off), kapalıysa tarif sayfalarında grid
 *   ve upload form render etmez; foto kayıtları DB'de dokunulmadan kalır,
 *   admin daha sonra tekrar açabilir.
 * - Altta tüm fotoğraflar (VISIBLE + HIDDEN karışık, en yeniden eski).
 *   Her karta toggle-visibility ve delete butonu.
 * - Pagination ileriki iş: şimdilik son 100 gösteriliyor. Yoğunluk
 *   arttığında cursor pagination eklenecek.
 */
export default async function AdminUserPhotosPage() {
  const [photos, flagEnabled, t] = await Promise.all([
    prisma.recipePhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        caption: true,
        status: true,
        createdAt: true,
        recipe: { select: { slug: true, title: true, emoji: true } },
        user: { select: { username: true, name: true } },
      },
    }),
    isUserPhotosEnabled(),
    getTranslations("admin.userPhotos"),
  ]);

  const visibleCount = photos.filter((p) => p.status === "VISIBLE").length;
  const hiddenCount = photos.length - visibleCount;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-heading text-xl font-bold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <section className="rounded-xl border border-border bg-bg-card p-5">
        <h3 className="mb-2 font-heading text-base font-semibold">
          {t("toggleHeading")}
        </h3>
        <p className="mb-4 text-sm text-text-muted">{t("toggleHelper")}</p>
        <UserPhotosFeatureToggle initialEnabled={flagEnabled} />
        <p className="mt-3 text-xs text-text-muted">
          {t("toggleStatus", {
            state: flagEnabled ? t("stateOn") : t("stateOff"),
          })}
        </p>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("queueHeading")}
          </h3>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>
              {t("countVisible", { count: visibleCount })}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t("countHidden", { count: hiddenCount })}</span>
          </div>
        </div>
        {photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
            {t("empty")}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <AdminPhotoCard
                key={photo.id}
                photoId={photo.id}
                thumbnailUrl={photo.thumbnailUrl ?? photo.imageUrl}
                fullUrl={photo.imageUrl}
                caption={photo.caption}
                status={photo.status}
                recipeTitle={photo.recipe.title}
                recipeSlug={photo.recipe.slug}
                recipeEmoji={photo.recipe.emoji}
                authorUsername={photo.user?.username ?? null}
                authorName={photo.user?.name ?? null}
                createdAt={photo.createdAt.toISOString()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
