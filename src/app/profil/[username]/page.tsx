import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserByUsername, getUserBookmarks, getUserVariations } from "@/lib/queries/user";
import { getPublicCollections, getUserCollections } from "@/lib/queries/collection";
import { getUserBadges } from "@/lib/badges/service";
import { formatDistanceToNow } from "@/lib/utils";
import { VerifyEmailBanner } from "@/components/auth/VerifyEmailBanner";
import { BadgeShelf } from "@/components/profile/BadgeShelf";
import { DeleteOwnVariationButton } from "@/components/recipe/DeleteOwnVariationButton";

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
  const session = await auth();
  const user = await getUserByUsername(username, session?.user?.id);

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;

  const [bookmarks, variations, collections, badges] = await Promise.all([
    isOwner ? getUserBookmarks(user.id) : Promise.resolve([]),
    getUserVariations(user.id, isOwner),
    isOwner ? getUserCollections(user.id) : getPublicCollections(user.id),
    getUserBadges(user.id),
  ]);

  // Owner-only fields (TS narrowing — only present when isOwner === true)
  const ownerEmail = "email" in user ? (user as { email: string }).email : null;
  const ownerEmailVerified =
    "emailVerified" in user
      ? (user as { emailVerified: Date | null }).emailVerified
      : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {isOwner && ownerEmail && !ownerEmailVerified && (
        <VerifyEmailBanner email={ownerEmail} />
      )}

      {/* Profile Header */}
      <div className="mb-8 flex items-start gap-6">
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
                Tarifle ekibi
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">@{user.username}</p>
          {user.bio && <p className="mt-2 text-sm text-text">{user.bio}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-muted">
            <span>{user._count.variations} uyarlama</span>
            {isOwner && <span>{user._count.bookmarks} kayıtlı tarif</span>}
            <span>Üye: {formatDistanceToNow(user.createdAt)}</span>
            {isOwner && (
              <Link
                href="/ayarlar"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Profili düzenle
              </Link>
            )}
          </div>
        </div>
      </div>

      <BadgeShelf badges={badges} />

      {/* Collections */}
      {(collections.length > 0 || isOwner) && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text">
              {isOwner ? "Koleksiyonlarım" : "Koleksiyonlar"}
            </h2>
            {isOwner && (
              <Link
                href="/alisveris-listesi"
                className="text-sm text-primary hover:text-primary-hover"
              >
                Alışveriş listesi →
              </Link>
            )}
          </div>
          {collections.length === 0 ? (
            <p className="text-sm text-text-muted">
              {isOwner
                ? "Henüz koleksiyon oluşturmadın. Bir tarifi açıp 'Koleksiyon' butonuyla başla."
                : "Herkese açık koleksiyon yok."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/koleksiyon/${c.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-bg-card transition-all hover:border-primary"
                >
                  <div className="grid h-32 grid-cols-2 gap-px bg-border">
                    {c.items.length === 0 ? (
                      <div className="col-span-2 flex items-center justify-center bg-bg-elevated text-4xl">
                        {c.emoji ?? "📁"}
                      </div>
                    ) : (
                      Array.from({ length: 4 }).map((_, i) => {
                        const item = c.items[i];
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-center bg-bg-elevated"
                          >
                            {item?.recipe.imageUrl ? (
                              <img
                                src={item.recipe.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">
                                {item?.recipe.emoji ?? ""}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-text transition-colors group-hover:text-primary">
                      {c.emoji && <span className="mr-1">{c.emoji}</span>}
                      {c.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                      <span>{c._count.items} tarif</span>
                      {c.isPublic && (
                        <span className="rounded-full bg-accent-green/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-green">
                          Açık
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Variations */}
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl font-bold text-text">Uyarlamalar</h2>
        {variations.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz uyarlama eklenmemiş.</p>
        ) : (
          <div className="space-y-3">
            {variations.map((v) => {
              // Owner sees non-public variations too — surface status so they
              // can tell at a glance what's live vs. in queue vs. removed.
              // PUBLISHED doesn't need a chip (the default state).
              const statusChip =
                v.status === "HIDDEN"
                  ? { label: "Gizlendi", classes: "bg-error/15 text-error" }
                  : v.status === "PENDING_REVIEW"
                  ? { label: "İncelemede", classes: "bg-secondary/20 text-secondary" }
                  : v.status === "REJECTED"
                  ? { label: "Reddedildi", classes: "bg-error/15 text-error" }
                  : v.status === "DRAFT"
                  ? { label: "Taslak", classes: "bg-bg-elevated text-text-muted" }
                  : null;

              return (
                <Link
                  key={v.id}
                  href={`/tarif/${v.recipe.slug}`}
                  className={`block rounded-lg border p-4 transition-colors hover:bg-bg-elevated ${
                    statusChip
                      ? "border-border/60 bg-bg-card/60"
                      : "border-border bg-bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate font-medium ${
                            statusChip ? "text-text-muted" : "text-text"
                          }`}
                        >
                          {v.miniTitle}
                        </p>
                        {statusChip && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusChip.classes}`}
                          >
                            {statusChip.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted">
                        {v.recipe.emoji} {v.recipe.title}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm text-text-muted">
                        {v.likeCount} beğeni
                      </span>
                      {isOwner && (
                        <DeleteOwnVariationButton
                          variationId={v.id}
                          miniTitle={v.miniTitle}
                          variant="compact"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
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
