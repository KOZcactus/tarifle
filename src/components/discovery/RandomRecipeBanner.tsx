"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getRandomRecipeAction } from "@/lib/actions/random-recipe";

interface RandomRecipeBannerProps {
  initial: { slug: string; title: string; emoji: string | null };
}

export function RandomRecipeBanner({ initial }: RandomRecipeBannerProps) {
  const [recipe, setRecipe] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleShuffle() {
    startTransition(async () => {
      const next = await getRandomRecipeAction();
      if (next) setRecipe(next);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 transition-all">
      <span className="text-4xl">🎲</span>
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Rastgele tarif
        </p>
        <Link
          href={`/tarif/${recipe.slug}`}
          className="mt-0.5 block font-heading text-lg font-bold text-text hover:text-primary"
        >
          {recipe.emoji} {recipe.title}
        </Link>
        <p className="mt-0.5 text-xs text-text-muted">
          Ne yapacağına karar veremiyorsan bu tarifi dene
        </p>
      </div>
      <button
        type="button"
        onClick={handleShuffle}
        disabled={isPending}
        className="shrink-0 rounded-lg border border-primary/30 bg-bg-card px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
      >
        {isPending ? "..." : "🎲 Başka tarif"}
      </button>
    </div>
  );
}
