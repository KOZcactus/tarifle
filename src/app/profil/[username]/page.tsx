import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserByUsername, getUserBookmarks, getUserVariations } from "@/lib/queries/user";
import { formatDistanceToNow } from "@/lib/utils";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "Kullanıcı Bulunamadı | Tarifle" };
  return {
    title: `${user.name || user.username} | Tarifle`,
    description: user.bio || `${user.name || user.username} profili`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const [user, session] = await Promise.all([
    getUserByUsername(username),
    auth(),
  ]);

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;

  const [bookmarks, variations] = await Promise.all([
    isOwner ? getUserBookmarks(user.id) : Promise.resolve([]),
    getUserVariations(user.id),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="mb-10 flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white">
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-text">
              {user.name || user.username}
            </h1>
            {user.isVerified && (
              <span className="rounded-full bg-accent-blue/10 px-2 py-0.5 text-xs font-medium text-accent-blue">
                Doğrulanmış
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">@{user.username}</p>
          {user.bio && <p className="mt-2 text-sm text-text">{user.bio}</p>}
          <div className="mt-3 flex gap-4 text-sm text-text-muted">
            <span>{user._count.variations} varyasyon</span>
            {isOwner && <span>{user._count.bookmarks} kayıtlı tarif</span>}
            <span>Üye: {formatDistanceToNow(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Variations */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-text">Varyasyonlar</h2>
        {variations.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz varyasyon eklenmemiş.</p>
        ) : (
          <div className="space-y-3">
            {variations.map((v) => (
              <Link
                key={v.id}
                href={`/tarif/${v.recipe.slug}`}
                className="block rounded-lg border border-border bg-bg-card p-4 transition-colors hover:bg-bg-elevated"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text">{v.miniTitle}</p>
                    <p className="text-sm text-text-muted">
                      {v.recipe.emoji} {v.recipe.title}
                    </p>
                  </div>
                  <span className="text-sm text-text-muted">{v.likeCount} beğeni</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bookmarks (only visible to owner) */}
      {isOwner && (
        <section>
          <h2 className="mb-4 font-heading text-xl font-bold text-text">Kayıtlı Tarifler</h2>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-text-muted">
              Henüz tarif kaydetmediniz.{" "}
              <Link href="/tarifler" className="text-primary hover:text-primary-hover">
                Tariflere göz at
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bookmarks.map((b) => (
                <Link
                  key={b.id}
                  href={`/tarif/${b.recipe.slug}`}
                  className="rounded-lg border border-border bg-bg-card p-4 transition-colors hover:bg-bg-elevated"
                >
                  <p className="font-medium text-text">
                    {b.recipe.emoji} {b.recipe.title}
                  </p>
                  <p className="text-sm text-text-muted">
                    {b.recipe.category.emoji} {b.recipe.category.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
