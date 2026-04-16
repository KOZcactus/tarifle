"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  target: number;
  duration?: number;
  className?: string;
}

/**
 * Animated count-up number. Starts at 0, reaches target in `duration` ms.
 * Uses easeOutExpo for a natural deceleration feel.
 */
export function CountUp({ target, duration = 1200, className }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span className={className}>{count.toLocaleString("tr-TR")}</span>;
}
