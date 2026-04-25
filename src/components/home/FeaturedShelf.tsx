"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { RecipeCard as RecipeCardType } from "@/types/recipe";
import type { DietBadgeData } from "@/lib/queries/diet-score";

interface FeaturedShelfProps {
  recipes: RecipeCardType[];
  /** Recipe ID -> diet badge map. Login + dietProfile yoksa undefined ya
   *  da bos Map. RecipeCard kosullu render eder. */
  dietBadges?: Map<string, DietBadgeData>;
}

/**
 * Home "Editör Seçimi" shelf component.
 *
 * Desktop (sm+): responsive grid (2-col / 3-col).
 * Mobile (<sm): horizontal scroll carousel with snap + arrow buttons.
 *
 * Mobile carousel:
 *   - scroll-snap-type: x mandatory for thumb-feel stops on each card
 *   - snap-align: start, card flush left when scrolling stops
 *   - 85vw kart genişliği, ~15vw sonraki kart peek (keşif sinyali)
 *   - left/right arrow buttons overlay, scroll pozisyonuna göre
 *     enable/disable. Tap → 85% viewport genişliği kadar scrollBy.
 *   - Native swipe zaten çalışır (touch scroll), arrow pointer + klavye
 *     navigasyonu desteği. Tab focus order doğal.
 *
 * Desktop grid kodu minimal farkla aynı, CSS media query tek sayfada
 * conditional render.
 */
export function FeaturedShelf({ recipes, dietBadges }: FeaturedShelfProps) {
  const t = useTranslations("home");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  /** Scroll pozisyonuna göre arrow enable/disable state'i güncelle. */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // 1px slack, float rounding (clientWidth hesabındaki 0.5px fark)
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollBy = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // Tek kart genişliği kadar kaydır (85% viewport). scrollBy'daki
    // smooth behavior snap ile uyumlu, browser en yakın snap'e oturur.
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  return (
    <div className="relative mt-6">
      {/* Mobile: horizontal scroll carousel */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 sm:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t("sectionFeatured")}
      >
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="w-[85%] shrink-0 snap-start"
          >
            <RecipeCard recipe={recipe} dietBadge={dietBadges?.get(recipe.id)} />
          </div>
        ))}
      </div>

      {/* Mobile arrows, absolute overlay on carousel. Desktop (sm+)
          hidden, grid kendi başına navigate edilir. */}
      <button
        type="button"
        onClick={() => scrollBy("left")}
        disabled={!canScrollLeft}
        aria-label={t("shelfScrollLeft")}
        className="absolute -left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-bg-card p-2 shadow-md transition-opacity hover:bg-bg-elevated disabled:pointer-events-none disabled:opacity-0 sm:hidden"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scrollBy("right")}
        disabled={!canScrollRight}
        aria-label={t("shelfScrollRight")}
        className="absolute -right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-bg-card p-2 shadow-md transition-opacity hover:bg-bg-elevated disabled:pointer-events-none disabled:opacity-0 sm:hidden"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Desktop: grid */}
      <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            dietBadge={dietBadges?.get(recipe.id)}
          />
        ))}
      </div>
    </div>
  );
}
