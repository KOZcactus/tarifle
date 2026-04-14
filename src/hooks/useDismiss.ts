import { useEffect, useRef, type RefObject } from "react";

interface UseDismissOptions {
  /** Whether the disclosure/menu is currently open. */
  isOpen: boolean;
  /** Callback to close it. Called on Escape or outside-click. */
  onClose: () => void;
  /**
   * Disable outside-click handling. Useful for disclosures that should only
   * close via Escape or an explicit button (e.g. modal dialogs that have
   * their own backdrop).
   */
  disableOutsideClick?: boolean;
}

/**
 * Close a menu/popup on Escape or a click outside its container.
 *
 * Attach the returned ref to the wrapping element whose children should be
 * considered "inside". Clicks on the trigger button that opens the menu
 * should be inside this same container or explicitly excluded, otherwise the
 * open toggle gets cancelled by the outside-click listener.
 *
 * Returned as a ref so callers can keep their existing root element and
 * simply spread `ref={ref}`. Uses `mousedown` (not `click`) so a drag that
 * starts inside and releases outside doesn't accidentally dismiss.
 */
export function useDismiss<T extends HTMLElement = HTMLElement>({
  isOpen,
  onClose,
  disableOutsideClick = false,
}: UseDismissOptions): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);

    let cleanupMouse: (() => void) | undefined;
    if (!disableOutsideClick) {
      function onMouseDown(e: MouseEvent) {
        const node = ref.current;
        if (!node) return;
        if (!node.contains(e.target as Node)) onClose();
      }
      document.addEventListener("mousedown", onMouseDown);
      cleanupMouse = () => document.removeEventListener("mousedown", onMouseDown);
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      cleanupMouse?.();
    };
  }, [isOpen, onClose, disableOutsideClick]);

  return ref;
}
