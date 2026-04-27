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

interface ItemListSchema {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  description?: string;
  numberOfItems: number;
  itemListElement: {
    "@type": "ListItem";
    position: number;
    url: string;
    name: string;
  }[];
}

/**
 * Recipe list ItemList JSON-LD. Google kategori/mutfak/diyet sayfalarının
 * bir "tarif koleksiyonu" olduğunu anlaması için; Recipe karnıyarığa
 * zaten individual Recipe schema veriyor, bu toplu katalog sayfaları
 * için list-level signal. Rich Results "Carousel" eligibility'si için
 * de şart (çoklu Recipe pointer).
 *
 * `items` sadece görünür sayfanın slug + title'ını içerir (pagination'a
 * uyumlu, tüm koleksiyonu değil). Google dokümantasyonu açıkça:
 * ItemList o sayfada görünen item'ların listesi olmalı, gizli veya
 * filtered dahil değil.
 *
 * url ve name mandatory; image + description opsiyonel ama trafik
 * sinyali artırır. Bu ilk pass'te url + name yeterli, çünkü list
 * page'de card'ta resim zaten görünür.
 */
interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

/**
 * FAQPage JSON-LD, landing sayfalarındaki SSS bölümünün rich-results
 * eligibility'si için. Her q+a Question/Answer pair'i olur. Google
 * dokümantasyonu: minimum 1 question, max ~10 önerilen, her cevap
 * tam metin (sadece özet değil).
 */
export function buildFaqPageSchema(
  faqs: { q: string; a: string }[] | null | undefined,
): FAQPageSchema {
  // Defensive guard, oturum 28 Sentry fix: SEO landing batch 3+4'te
  // 5 entry'de faqs field'ı eksik teslim edildi (atistirmaliklar /
  // sebze-yemekleri / portekiz / smoothie-shake / soslar-dippler).
  // Empty/undefined → boş array, sayfa çakılmasın. Caller'lar yine de
  // landingCopy.faqs?.length kontrolü yapsın ki rich result eligibility
  // için boş FAQPage emit etmeyelim.
  const safe = faqs ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: safe.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export function buildRecipeListSchema(options: {
  name: string;
  description?: string;
  items: { slug: string; title: string }[];
}): ItemListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    numberOfItems: options.items.length,
    itemListElement: options.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/tarif/${item.slug}`,
      name: item.title,
    })),
  };
}
