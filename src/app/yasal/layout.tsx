import { getTranslations } from "next-intl/server";
import { ActiveNavLink } from "@/components/legal/ActiveNavLink";

/**
 * Shared layout for every legal sub-page. Sol tarafta sticky bir sidebar
 * ile sayfalar arası geçiş, sağ tarafta sayfa içeriği. Trendyol tarzı
 * "Yasal Bilgilendirme" hub deneyimi — user ana surface'de ayrı linkler
 * aramak zorunda kalmaz.
 *
 * Sayfalar kendi max-width / padding'ini uygulamaz; burada tek bir
 * wrapper sağlanır. İçerik merkeze oturur, mobile'de sidebar üste kayar.
 */
export default async function YasalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("legalHub");

  const links = [
    { href: "/yasal", labelKey: "pageTitle" },
    { href: "/yasal/kvkk", labelKey: "cards.kvkk.title" },
    { href: "/yasal/kullanim-kosullari", labelKey: "cards.kullanim.title" },
    { href: "/yasal/gizlilik", labelKey: "cards.gizlilik.title" },
    { href: "/yasal/cerez-politikasi", labelKey: "cards.cerez.title" },
    { href: "/yasal/guvenlik", labelKey: "cards.guvenlik.title" },
    { href: "/yasal/iletisim-aydinlatma", labelKey: "cards.iletisim.title" },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav aria-label={t("navHeading")}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("navHeading")}
            </h2>
            <ul className="space-y-1 rounded-xl border border-border bg-bg-card p-2">
              {links.map((link) => (
                <li key={link.href}>
                  <ActiveNavLink href={link.href}>
                    {t(link.labelKey)}
                  </ActiveNavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
