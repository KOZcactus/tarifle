import Link from "next/link";
import { FollowButton } from "./FollowButton";

interface FollowUserCardProps {
  userId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  secondaryLine: string;
  showFollowButton: boolean;
  viewerSignedIn: boolean;
  viewerFollows: boolean;
}

/**
 * Tekil user kartı, takipçiler/takip ettikleri/önerilen aşçılar
 * listelerinde paylaşılır. Server component kullanıyor olsa da
 * `FollowButton` client'tır; oraya gerekli state iki prop olarak
 * iletilir (viewerSignedIn + viewerFollows).
 */
export function FollowUserCard({
  userId,
  username,
  name,
  avatarUrl,
  bio,
  secondaryLine,
  showFollowButton,
  viewerSignedIn,
  viewerFollows,
}: FollowUserCardProps) {
  const displayName = name ?? `@${username}`;
  const initials = (name ?? username).charAt(0).toUpperCase();

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-card p-4">
      <Link
        href={`/profil/${username}`}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-bold text-primary"
        aria-label={displayName}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profil/${username}`}
          className="block truncate text-sm font-semibold text-text hover:text-primary"
        >
          {displayName}
        </Link>
        <p className="truncate text-xs text-text-muted">@{username}</p>
        {bio && (
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">{bio}</p>
        )}
        <p className="mt-1 text-[11px] text-text-muted">{secondaryLine}</p>
      </div>
      {showFollowButton && (
        <div className="shrink-0">
          <FollowButton
            targetUserId={userId}
            initialFollowing={viewerFollows}
            signedIn={viewerSignedIn}
          />
        </div>
      )}
    </div>
  );
}

