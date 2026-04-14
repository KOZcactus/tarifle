"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SITE_NAME } from "@/lib/constants";
import { useDismiss } from "@/hooks/useDismiss";

const NAV_LINKS = [
  { href: "/tarifler", label: "Tarifler" },
  { href: "/kesfet", label: "Keşfet" },
  { href: "/ai-asistan", label: "AI Asistan" },
] as const;

interface NavbarProps {
  /**
   * Server-rendered slot for the notification bell. Navbar is a client
   * component (needs useSession), so we accept the already-rendered RSC
   * tree as a prop and mount it in the right spot. Pass `null` or omit
   * to hide the bell entirely.
   */
  notificationSlot?: React.ReactNode;
}

export function Navbar({ notificationSlot }: NavbarProps = {}) {
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const closeProfile = useCallback(() => setIsProfileOpen(false), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  const profileRef = useDismiss<HTMLDivElement>({
    isOpen: isProfileOpen,
    onClose: closeProfile,
  });
  const mobileRef = useDismiss<HTMLDivElement>({
    isOpen: isMobileOpen,
    onClose: closeMobile,
    // Mobile menu covers a strip under the navbar — outside-click would
    // dismiss on every scroll drag. Keyboard Escape is enough.
    disableOutsideClick: true,
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold text-primary">
            {SITE_NAME}
          </span>
          <span className="hidden text-xs text-text-muted sm:block">Make Eat</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-muted transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Notification bell — only renders for logged-in users (loader returns null otherwise) */}
          {notificationSlot}

          {session?.user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-controls="profile-menu"
                className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {session.user.name?.charAt(0).toUpperCase() || "U"}
                </span>
                {session.user.name?.split(" ")[0] || "Kullanıcı"}
              </button>
              {isProfileOpen && (
                <div
                  id="profile-menu"
                  role="menu"
                  aria-label="Kullanıcı menüsü"
                  className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-bg-card py-1 shadow-lg"
                >
                  <Link
                    href={`/profil/${session.user.username}`}
                    role="menuitem"
                    onClick={closeProfile}
                    className="block px-4 py-2 text-sm text-text hover:bg-bg-elevated focus-visible:bg-bg-elevated focus-visible:outline-none"
                  >
                    Profilim
                  </Link>
                  <Link
                    href="/alisveris-listesi"
                    role="menuitem"
                    onClick={closeProfile}
                    className="block px-4 py-2 text-sm text-text hover:bg-bg-elevated focus-visible:bg-bg-elevated focus-visible:outline-none"
                  >
                    Alışveriş Listem
                  </Link>
                  {(session.user.role === "ADMIN" || session.user.role === "MODERATOR") && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={closeProfile}
                      className="block px-4 py-2 text-sm text-primary hover:bg-bg-elevated focus-visible:bg-bg-elevated focus-visible:outline-none"
                    >
                      Yönetim Paneli
                    </Link>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-bg-elevated focus-visible:bg-bg-elevated focus-visible:outline-none"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/giris"
              className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover md:block"
            >
              Giriş Yap
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
            aria-label={isMobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-menu"
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
              {isMobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div
          id="mobile-menu"
          ref={mobileRef}
          className="border-t border-border px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-card hover:text-text"
              >
                {link.label}
              </Link>
            ))}
            {session?.user ? (
              <>
                <Link
                  href={`/profil/${session.user.username}`}
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-card hover:text-text"
                >
                  Profilim
                </Link>
                <Link
                  href="/alisveris-listesi"
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-card hover:text-text"
                >
                  Alışveriş Listem
                </Link>
                {(session.user.role === "ADMIN" || session.user.role === "MODERATOR") && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-bg-card"
                  >
                    Yönetim Paneli
                  </Link>
                )}
                <button
                  onClick={() => { setIsMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-bg-card"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <Link
                href="/giris"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
