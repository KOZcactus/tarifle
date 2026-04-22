import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { bricolage, geistSans, geistMono } from "@/styles/fonts";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBellLoader } from "@/components/notifications/NotificationBellLoader";
import { AnnouncementBanner } from "@/components/announcement/AnnouncementBanner";
import { getActiveAnnouncements } from "@/lib/queries/admin";
import { Footer } from "@/components/layout/Footer";
import { DeferredBanners } from "@/components/layout/DeferredBanners";
import { BfCacheRestore } from "@/components/layout/BfCacheRestore";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/seo/structured-data";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.site");
  const tagline = t("tagline");
  const description = t("description");
  return {
    title: {
      default: tagline,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: tagline,
      description,
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: t("ogLocale"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tagline,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    // RSS auto-discovery, feed reader'lar (Feedly, Inoreader, browser
    // extension'ları) ana sayfaya bakınca otomatik feed tespit etsin.
    // Google Feed crawler da bu link'i takip eder. Tarifle feed URL'i
    // `/feed.xml` (App Router route), `/rss.xml` eski referans kalan.
    //
    // hreflang alternates: Tarifle cookie-based i18n (NEXT_LOCALE cookie
    // veya User.locale DB). Aynı URL farklı lang render ediyor; Google'a
    // "bu URL iki dil için geçerli" sinyali için x-default + tr + en
    // tanımlandı. x-default Türkçe (primary audience).
    alternates: {
      canonical: "/",
      languages: {
        "tr-TR": SITE_URL,
        "en-US": SITE_URL,
        "x-default": SITE_URL,
      },
      types: {
        "application/rss+xml": `${SITE_URL}/feed.xml`,
      },
    },
    // Pinterest rich pin + domain claim. PINTEREST_DOMAIN_VERIFY set
    // edildiyse <meta name="p:domain_verify"> yayinlanir. pinterest-rich-pin
    // opt-in sinyali, Recipe/Article JSON-LD ile birlikte Pinterest crawler'a
    // "bu sayfalar rich pin aday" der.
    other: {
      "pinterest-rich-pin": "true",
      ...(process.env.PINTEREST_DOMAIN_VERIFY
        ? { "p:domain_verify": process.env.PINTEREST_DOMAIN_VERIFY }
        : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Aktif duyurular RSC olarak burada çekilir, client banner sadece
  // localStorage dismissal state'ini izler. Boş liste ise banner hiç render
  // edilmez (hydration sonrası). Cache: RSC per-request.
  const [announcements, locale, messages, tMeta] = await Promise.all([
    getActiveAnnouncements(),
    getLocale(),
    getMessages(),
    getTranslations("metadata.site"),
  ]);

  // Site-wide JSON-LD: WebSite (SearchAction → sitelinks search box) +
  // Organization (logo, sameAs → knowledge panel). Tarif detay sayfaları
  // kendi Recipe/Breadcrumb/FAQPage JSON-LD'lerini ayrıca yayar.
  const description = tMeta("description");
  const siteSchemas = [
    buildWebSiteSchema(description),
    buildOrganizationSchema(description),
  ];

  return (
    <html
      lang={locale}
      className={`${bricolage.variable} ${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        {siteSchemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <BfCacheRestore />
            <Navbar notificationSlot={<NotificationBellLoader />} />
            {announcements.length > 0 && (
              <AnnouncementBanner announcements={announcements} />
            )}
            <main className="flex-1 print:pt-0">{children}</main>
            <Footer />
            <DeferredBanners />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
