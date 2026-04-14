"use client";

import { useCallback, useEffect, useState } from "react";
import { useDismiss } from "@/hooks/useDismiss";

interface ShareMenuProps {
  title: string;
  url: string;
  text?: string;
}

/**
 * Share menu with Web Share API + fallback (WhatsApp, X/Twitter, copy link).
 *
 * On mobile browsers that expose `navigator.share`, we skip our dropdown and
 * let the OS native share sheet handle it — it covers every app the user has.
 */
export function ShareMenu({ title, url, text }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const menuRef = useDismiss<HTMLDivElement>({
    isOpen: isOpen && !hasNativeShare,
    onClose: closeMenu,
  });

  // SSR-hydration guard: `navigator.share` is only defined on the client,
  // and we need it to decide whether to render our own dropdown or defer
  // to the OS share sheet. The React 19 rule flags setState in an effect
  // as usually-avoidable, but external-API detection is the legitimate
  // exception.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function handleNativeShare() {
    try {
      await navigator.share({
        title,
        text: text ?? title,
        url,
      });
    } catch {
      // User dismissed — ignore
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text ?? title);
  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;

  function openShare() {
    if (hasNativeShare) {
      handleNativeShare();
    } else {
      setIsOpen((v) => !v);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={openShare}
        aria-haspopup={hasNativeShare ? undefined : "true"}
        aria-expanded={!hasNativeShare && isOpen}
        aria-label="Paylaş"
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Paylaş
      </button>

      {!hasNativeShare && isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 w-60 origin-top-left rounded-xl border border-border bg-bg-card p-2 shadow-lg"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text transition-colors hover:bg-bg-elevated"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.8.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />
              </svg>
            </span>
            WhatsApp
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text transition-colors hover:bg-bg-elevated"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
            X (Twitter)
          </a>

          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text transition-colors hover:bg-bg-elevated"
          >
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors ${
                copied ? "bg-accent-green" : "bg-accent-blue"
              }`}
            >
              {copied ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </span>
            {copied ? "Kopyalandı!" : "Bağlantıyı kopyala"}
          </button>
        </div>
      )}
    </div>
  );
}
