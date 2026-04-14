import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getViewableCollection } from "@/lib/queries/collection";
import { formatMinutes, getDifficultyLabel } from "@/lib/utils";
import { CollectionActions } from "@/components/collection/CollectionActions";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  // Use auth-gated helper so private collection names/descriptions don't leak
  // into <title>/<meta description>.
  const session = await auth();
  const collection = await getViewableCollection(id, session?.user?.id);
  if (!collection) return { title: "Koleksiyon bulunamadı" };

  return {
    title: `${collection.name} | @${collection.user.username}`,
    description:
      collection.description ||
      `${collection.user.name || collection.user.username} tarafından oluşturulan ${collection.items.length} tariflik koleksiyon.`,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const session = await auth();
  const collection = await getViewableCollection(id, session?.user?.id);

  if (!collection) notFound();

  const isOwner = session?.user?.id === collection.userId;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link
              href={`/profil/${collection.user.username}`}
              className="text-sm text-text-muted transition-colors hover:text-text"
            >
              @{collection.user.username}
            </Link>
            <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
              {collection.emoji && <span className="mr-2">{collection.emoji}</span>}
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-3 text-text-muted">{collection.description}</p>
            )}
            <div className="mt-4 flex items-center gap-3 text-sm text-text-muted">
              <span>{collection.items.length} tarif</span>
              {collection.isPublic ? (
                <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs font-medium text-accent-green">
                  Herkese açık
                </span>
              ) : (
                <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs font-medium text-text-muted">
                  Gizli
                </span>
              )}
            </div>
          </div>

          {isOwner && (
            <CollectionActions
              collection={{
                id: collection.id,
                name: collection.name,
                description: collection.description,
                emoji: collection.emoji,
                isPublic: collection.isPublic,
              }}
              username={collection.user.username}
            />
          )}
        </div>
      </header>

      {/* Recipe grid */}
      {collection.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-text-muted">
            Bu koleksiyonda henüz tarif yok.
            {isOwner && (
              <>
                {" "}
                <Link
                  href="/tarifler"
                  className="text-primary hover:text-primary-hover"
                >
                  Tariflere göz at →
                </Link>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collection.items.map((item) => (
            <Link
              key={item.id}
              href={`/tarif/${item.recipe.slug}`}
              className="group overflow-hidden rounded-xl border border-border bg-bg-card transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-40 items-center justify-center bg-bg-elevated">
                {item.recipe.imageUrl ? (
                  <img
                    src={item.recipe.imageUrl}
                    alt={item.recipe.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">{item.recipe.emoji}</span>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-text transition-colors group-hover:text-primary">
                  {item.recipe.title}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {item.recipe.category.emoji} {item.recipe.category.name}
                </p>
                <div className="mt-2 flex gap-2 text-xs text-text-muted">
                  <span>{getDifficultyLabel(item.recipe.difficulty)}</span>
                  <span>•</span>
                  <span>{formatMinutes(item.recipe.totalMinutes)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
