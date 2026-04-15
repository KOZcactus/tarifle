import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const FOOTER_LINKS = {
  platform: [
    { href: "/tarifler", label: "Tarifler" },
    { href: "/kesfet", label: "Keşfet" },
  ],
  legal: [
    { href: "/hakkimizda", label: "Hakkımızda" },
    { href: "/kvkk", label: "KVKK" },
    { href: "/kullanim-sartlari", label: "Kullanım Şartları" },
    { href: "/gizlilik", label: "Gizlilik Politikası" },
  ],
} as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="font-heading text-xl font-bold text-primary">
              {SITE_NAME}
            </Link>
            <p className="mt-2 text-sm text-text-muted">
              Yemek, içecek ve kokteyl tariflerini sade ve topluluk katkısına açık şekilde sunan
              modern tarif platformu.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-text">Platform</h3>
            <ul className="mt-3 space-y-2">
              {FOOTER_LINKS.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text">Yasal</h3>
            <ul className="mt-3 space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-xs text-text-muted">
            &copy; {new Date().getFullYear()} {SITE_NAME}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
