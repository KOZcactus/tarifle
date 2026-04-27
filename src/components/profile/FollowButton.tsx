"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toggleFollowAction } from "@/lib/actions/follow";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
  signedIn: boolean;
}

/**
 * Takip et / takibi bırak butonu, profil header'ında.
 *
 * Anonymous kullanıcı clickleyince /giris'e yönlendirir (UI flow
 * kesintiye uğramasın). Session varsa server action çağrılır ve
 * dönen `following` state'i local state'i günceller (router.refresh
 * de revalidate ettiği için ikinci bir render'da sayaçlar yenilenir).
 */
export function FollowButton({
  targetUserId,
  initialFollowing,
  signedIn,
}: FollowButtonProps) {
  const t = useTranslations("profile.follow");
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    if (!signedIn) {
      router.push(
        `/giris?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    startTransition(async () => {
      const result = await toggleFollowAction(targetUserId);
      if (result.success && typeof result.following === "boolean") {
        setFollowing(result.following);
        router.refresh();
      } else {
        setError(t(`error_${result.error ?? "unknown"}` as "error_unknown"));
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={following}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          following
            ? "border border-border bg-bg-card text-text hover:bg-bg-elevated"
            : "bg-primary text-white hover:bg-primary-hover"
        } ${isPending ? "opacity-70" : ""}`}
      >
        {following ? t("buttonFollowing") : t("buttonFollow")}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
