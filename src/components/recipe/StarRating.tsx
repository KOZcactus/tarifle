"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** 0-5 gösterim değeri. Kesirli değerler yarım yıldız göstermez, en yakın tama yuvarlar (Schema.org best-practice, AggregateRating integer shown as N.N stars). */
  value: number;
  /** Interactive mod, user click seçer. Default false = read-only. */
  interactive?: boolean;
  /** Interactive modda kullanıcı seçince tetiklenir. */
  onChange?: (value: number) => void;
  /** Boyut, md (24px) default, sm (16px) chip içi, lg (32px) form. */
  size?: "sm" | "md" | "lg";
  /** Accessibility label override, read-only'de "4 yıldız (25 yorum)", interactive'de "Yıldız seç". Verilmezse i18n key'inden üretilir. */
  ariaLabel?: string;
  className?: string;
}

const SIZES = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-8 w-8" } as const;

export function StarRating({
  value,
  interactive = false,
  onChange,
  size = "md",
  ariaLabel,
  className,
}: StarRatingProps) {
  const t = useTranslations("reviews.star");
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={ariaLabel ?? t("valueAria", { n: value.toFixed(1) })}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n - 0.25;
        const half = !filled && display >= n - 0.75;
        const fillClass = filled
          ? "fill-[#f5a623] text-[#f5a623]"
          : half
            ? "fill-[#f5a623]/50 text-[#f5a623]"
            : "fill-transparent text-gray-300 dark:text-gray-600";

        const star = (
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            className={cn(SIZES[size], fillClass, "transition-colors")}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.11z"
            />
          </svg>
        );

        if (!interactive) return <span key={n}>{star}</span>;

        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={t("pickAria", { n })}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
