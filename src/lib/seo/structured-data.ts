/**
 * Site-wide JSON-LD structured data helpers.
 *
 * Recipe + BreadcrumbList + FAQPage JSON-LD tarif detay sayfasında
 * yaşıyor. Bu modül site-seviyesi (WebSite, Organization) JSON-LD'leri
 * üretir, root layout'tan <script> olarak yayınlanır.
 *
 * - WebSite: SearchAction bildirimi; Google SERP'te sitelinks search box
 *   render edebilir (site adını aradığında Google arama kutusu çıkar).
 * - Organization: brand knowledge graph girişi. Logo, sameAs (social),
 *   contact point; Google Knowledge Panel için sinyal.
 */
import { SITE_NAME, SITE_URL } from "@/lib/constants";

interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  alternateName?: string[];
  url: string;
  potentialAction: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
  inLanguage: string[];
}

interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  description: string;
}

export function buildWebSiteSchema(_description: string): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Tarifle.app"],
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/tarifler?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["tr", "en"],
  };
}

export function buildOrganizationSchema(description: string): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description,
    sameAs: [
      // Pinterest claim yapıldı (docs/SEO_SUBMISSION.md), profil URL'si
      // tarifle.app Pinterest account setup sonrasında eklenecek.
      // Yeni sosyal hesap açıldıkça bu listeye eklenir.
    ],
  };
}
