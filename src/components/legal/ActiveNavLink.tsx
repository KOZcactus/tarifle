"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ActiveNavLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Legal sidebar navigation link, sets `aria-current="page"` when the
 * current pathname matches `href`. Exact match (not prefix) because the
 * hub `/yasal` should not highlight while on `/yasal/kvkk`. Kept as a
 * client component so it can read the live pathname.
 */
export function ActiveNavLink({ href, children }: ActiveNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="block rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-bg-elevated hover:text-text aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-primary"
    >
      {children}
    </Link>
  );
}
