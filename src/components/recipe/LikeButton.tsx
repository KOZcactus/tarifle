"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toggleLikeAction } from "@/lib/actions/like";

interface LikeButtonProps {
  variationId: string;
  recipePath: string;
  initialLikeCount: number;
  initialLiked: boolean;
  /**
   * Author kendi uyarlamasını beğenemez — server tarafı `notifyVariationLiked`
   * self-like'ı zaten skip ediyor ve toggle çalışıyor ama UX olarak da
   * gizliyoruz: kart sahibi bu butonu hiç görmez. Pas geçilirse default
   * false (gösterir).
   */
  isOwnVariation?: boolean;
}

export function LikeButton({
  variationId,
  recipePath,
  initialLikeCount,
  initialLiked,
  isOwnVariation = false,
}: LikeButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("likes");
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikeCount);

  // Author kendi uyarlamasında butonu görmez — sadece "❤️ N" ifadesi.
  if (isOwnVariation) {
    return (
      <span
        className="inline-flex items-center gap-1 text-sm text-text-muted"
        aria-label={t("countAria", { n: count })}
      >
        <span aria-hidden="true">❤️</span>
        <span>{count}</span>
      </span>
    );
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push("/giris");
      return;
    }

    const wasLiked = liked;
    const previousCount = count;
    setLiked(!wasLiked);
    setCount(wasLiked ? previousCount - 1 : previousCount + 1);

    startTransition(async () => {
      const result = await toggleLikeAction(variationId, recipePath);
      if (!result.success || result.liked !== !wasLiked) {
        setLiked(wasLiked);
        setCount(previousCount);
      } else {
        setLiked(result.liked);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? t("unlikeAria") : t("likeAria")}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
        liked
          ? "text-error hover:bg-error/10"
          : "text-text-muted hover:bg-bg-elevated hover:text-text"
      } disabled:opacity-50`}
    >
      <span aria-hidden="true" className={liked ? "scale-110 transition-transform" : ""}>
        {liked ? "❤️" : "🤍"}
      </span>
      <span className="font-medium tabular-nums">{count}</span>
    </button>
  );
}
