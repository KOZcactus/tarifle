import Link from "next/link";

export interface BreadcrumbItem {
  /** Görünür label. */
  label: string;
  /** Link hedefi. Aktif (son) item'da undefined olur — span render edilir. */
  href?: string;
}

interface LandingBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Programatik landing sayfaları için breadcrumb (schema.org JSON-LD +
 * görsel render). Ana sayfa → /tarifler → kategori → mevcut landing
 * şeklinde hiyerarşi. Görsel render chip-style; aktif item muted
 * kalır, link'ler primary hover.
 *
 * JSON-LD schema.org BreadcrumbList generator sayfa içinde ayrı bir
 * <script type="application/ld+json"> etiketiyle sunulur (bu component
 * sadece görsel; caller seo helper ile script tag'i ekler).
 */
export function LandingBreadcrumb({ items }: LandingBreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className="mb-4 text-xs text-text-muted"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-text" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
