import { useEffect, useRef, type RefObject } from "react";

/**
 * Selector for elements that are keyboard-focusable by default. Mirrors the
 * set that WAI-ARIA Authoring Practices enumerate for dialogs. We explicitly
 * exclude `[tabindex="-1"]` so that programmatically-focusable-only elements
 * (e.g. the dialog wrapper itself) don't participate in Tab cycling.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Trap keyboard focus within a container while `isOpen` is true.
 *
 * - Moves focus to the first focusable element when opened (or the container
 *   itself if none; it's given `tabindex={-1}` by the caller).
 * - Restores focus to the element that was focused before opening when closed.
 * - Loops Tab/Shift+Tab at the container's boundaries.
 *
 * Intended for true modal dialogs (with a backdrop). Plain dropdowns should
 * use `useDismiss` instead — trapping focus in a dropdown is hostile.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isOpen: boolean,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const container = ref.current;
    if (!container) return;

    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    const first = focusables[0] ?? container;
    // Small timeout lets browser paint first — otherwise some setups scroll
    // or shift layout when we focus something that's still being inserted.
    const raf = requestAnimationFrame(() => first.focus());

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const node = ref.current;
      if (!node) return;
      const list = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to whatever had it before the trap was engaged.
      // Guard with a check in case the previous element was removed from DOM
      // while the dialog was open.
      const prev = previouslyFocused.current;
      if (prev && document.contains(prev)) {
        prev.focus();
      }
    };
  }, [isOpen]);

  return ref;
}
