import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

export async function Footer() {
  const [t, tNav] = await Promise.all([
    getTranslations("footer"),
    getTranslations("nav"),
  ]);

  return (
    <footer className="mt-auto border-t border-border bg-bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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

          {/* Corporate, Hakkımızda + İletişim ("legal" değil, ama aynı
              kolona topluyoruz çünkü Platform'dan sonra 2 kolon yeter). */}
          <div>
            <h3 className="text-sm font-semibold text-text">{t("corporate")}</h3>
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
                  href="/iletisim"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {t("linkContact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/basin"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  {t("linkPress")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter opt-in, double-opt-in + unsubscribe flow.
              Footer'da compact variant; haftalık editör seçkisi satışı. */}
          <div className="sm:col-span-2 lg:col-span-1">
            <NewsletterForm variant="footer" />
          </div>
        </div>

        {/* Legal, tek hub link + mini copyright satırı. "Ulu orta" olmasın
            ama bulunabilir kalsın (Kerem'in talebi, Trendyol pattern'i). */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <p>
              {t("copyright", { year: new Date().getFullYear(), site: SITE_NAME })}
            </p>
            <Link
              href="/yasal"
              className="transition-colors hover:text-text"
            >
              {t("linkLegalHub")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
