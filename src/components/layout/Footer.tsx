import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";

export async function Footer() {
  const [t, tNav] = await Promise.all([
    getTranslations("footer"),
    getTranslations("nav"),
  ]);

  return (
    <footer className="mt-auto border-t border-border bg-bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="font-heading text-xl font-bold text-primary">
              {SITE_NAME}
            </Link>
            <p className="mt-2 text-sm text-text-muted">{t("brandTagline")}</p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-text">{t("platform")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/tarifler"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {tNav("recipes")}
                </Link>
              </li>
              <li>
                <Link
                  href="/kesfet"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {tNav("discover")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text">{t("legal")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/hakkimizda"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {t("linkAbout")}
                </Link>
              </li>
              <li>
                <Link
                  href="/kvkk"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {t("linkKvkk")}
                </Link>
              </li>
              <li>
                <Link
                  href="/kullanim-sartlari"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {t("linkTerms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/gizlilik"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {t("linkPrivacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-xs text-text-muted">
            {t("copyright", { year: new Date().getFullYear(), site: SITE_NAME })}
          </p>
        </div>
      </div>
    </footer>
  );
}
