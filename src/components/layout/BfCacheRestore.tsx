"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * bf-cache (back/forward cache) restoration handler.
 *
 * Problem: NextAuth sets `Set-Cookie` on every response, which tells
 * browsers to evict the page from bfcache. When the user presses back,
 * the page reloads from scratch instead of restoring instantly.
 *
 * Fix: Listen for `pageshow` with `persisted=true` (bfcache restore)
 * and call `router.refresh()` to re-fetch server components without
 * a full page reload. This keeps the session fresh while allowing
 * bfcache to work on browsers that support it.
 *
 * Also handles the stale-tab scenario: if the page has been in bfcache
 * for more than 5 minutes, do a soft refresh to ensure data is current.
 */
export function BfCacheRestore() {
  const router = useRouter();

  useEffect(() => {
    let lastActive = Date.now();

    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        const elapsed = Date.now() - lastActive;
        // If restored from bfcache, refresh server components
        // to get fresh session + data
        if (elapsed > 5000) {
          router.refresh();
        }
      }
      lastActive = Date.now();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastActive;
        // Tab was hidden for 5+ minutes — soft refresh
        if (elapsed > 5 * 60 * 1000) {
          router.refresh();
        }
      }
      lastActive = Date.now();
    }

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
