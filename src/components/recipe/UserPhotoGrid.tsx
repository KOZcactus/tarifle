import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteRecipePhotoButton } from "./DeleteRecipePhotoButton";

interface UserPhotoGridProps {
  recipeId: string;
}

/**
 * Server component: fetches VISIBLE photos for the recipe and renders a
 * responsive 4-col grid with caption overlay. Each photo links to the
 * full-resolution Cloudinary URL in a new tab (lightbox yerine basic). Owner
 * + admin için sil butonu aynı kartta render edilir.
 */
export async function UserPhotoGrid({ recipeId }: UserPhotoGridProps) {
  const [photos, session, t] = await Promise.all([
    prisma.recipePhoto.findMany({
      where: { recipeId, status: "VISIBLE" },
      orderBy: { createdAt: "asc" },
      take: 12,
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        caption: true,
        userId: true,
        createdAt: true,
        user: { select: { username: true, name: true } },
      },
    }),
    auth(),
    getTranslations("recipe.userPhotos"),
  ]);

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-bg-card/40 p-4 text-center text-sm text-text-muted">
        {t("emptyState")}
      </p>
    );
  }

  const viewerId = session?.user?.id ?? null;

  // Admin/moderator role guard for delete button; we don't block fetch,
  // just control which photos show the remove action.
  let viewerIsAdmin = false;
  if (viewerId) {
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { role: true },
    });
    viewerIsAdmin = viewer?.role === "ADMIN" || viewer?.role === "MODERATOR";
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => {
        const canDelete = viewerIsAdmin || photo.userId === viewerId;
        const authorLabel =
          photo.user?.name ?? photo.user?.username ?? t("anonymous");
        return (
          <figure
            key={photo.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-bg-card"
          >
            <Link
              href={photo.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square bg-bg-elevated"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl ?? photo.imageUrl}
                alt={photo.caption ?? t("defaultAlt", { author: authorLabel })}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
              />
            </Link>
            <figcaption className="px-2 py-2 text-xs text-text-muted">
              <div className="truncate text-text">
                {photo.user?.username ? (
                  <Link
                    href={`/profil/${photo.user.username}`}
                    className="font-medium hover:text-primary"
                  >
                    {authorLabel}
                  </Link>
                ) : (
                  <span>{authorLabel}</span>
                )}
              </div>
              {photo.caption && (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-text-muted">
                  {photo.caption}
                </p>
              )}
            </figcaption>
            {canDelete && (
              <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                <DeleteRecipePhotoButton photoId={photo.id} />
              </div>
            )}
          </figure>
        );
      })}
    </div>
  );
}
