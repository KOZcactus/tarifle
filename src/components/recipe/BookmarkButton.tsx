"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toggleBookmarkAction } from "@/lib/actions/bookmark";

interface BookmarkButtonProps {
  recipeId: string;
  initialBookmarked: boolean;
}

export function BookmarkButton({ recipeId, initialBookmarked }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!session?.user) {
      router.push("/giris");
      return;
    }

    setBookmarked(!bookmarked);
    startTransition(async () => {
      const result = await toggleBookmarkAction(recipeId);
      if (result.success) {
        setBookmarked(result.bookmarked!);
      } else {
        setBookmarked(bookmarked);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        bookmarked
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-text-muted hover:border-primary hover:text-primary"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
      {bookmarked ? "Kaydedildi" : "Kaydet"}
    </button>
  );
}
