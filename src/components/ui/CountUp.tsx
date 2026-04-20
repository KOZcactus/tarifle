"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  target: number;
  duration?: number;
  className?: string;
}

/**
 * Animated count-up number. Reaches `target` in `duration` ms with
 * easeOutExpo.
 *
 * Initial state seeds to `target` so SSR, crawlers (Google, GPT analysis),
 * and the first paint see the real number, starting at 0 would render
 * "0 tarif" into the HTML and get indexed that way, as a recent external
 * audit flagged. Animation kicks in after mount on the client only.
 */
export function CountUp({ target, duration = 1200, className }: CountUpProps) {
  const [count, setCount] = useState(target);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current || target <= 0) return;
    hasAnimatedRef.current = true;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    // First setCount happens inside the rAF callback (not synchronously in
    // the effect), `Math.round(eased * target)` at progress ≈ 0 is near
    // zero, so the animation still reads as a count-up from 0 → target.
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span className={className}>{count.toLocaleString("tr-TR")}</span>;
}
