import type { Metadata, Viewport } from "next";
import { bricolage, geistSans, geistMono } from "@/styles/fonts";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBellLoader } from "@/components/notifications/NotificationBellLoader";
import { AnnouncementBanner } from "@/components/announcement/AnnouncementBanner";
import { getActiveAnnouncements } from "@/lib/queries/admin";
import { Footer } from "@/components/layout/Footer";
import { BfCacheRestore } from "@/components/layout/BfCacheRestore";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
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

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Make Eat`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
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
    title: `${SITE_NAME} — Make Eat`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Make Eat`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  // RSS auto-discovery — feed reader'lar (Feedly, Inoreader, browser
  // extension'ları) ana sayfaya bakınca otomatik feed tespit etsin.
  // Google Feed crawler da bu link'i takip eder.
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Aktif duyurular RSC olarak burada çekilir — client banner sadece
  // localStorage dismissal state'ini izler. Boş liste ise banner hiç render
  // edilmez (hydration sonrası). Cache: RSC per-request.
  const announcements = await getActiveAnnouncements();

  return (
    <html
      lang="tr"
      className={`${bricolage.variable} ${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <BfCacheRestore />
          <Navbar notificationSlot={<NotificationBellLoader />} />
          {announcements.length > 0 && (
            <AnnouncementBanner announcements={announcements} />
          )}
          <main className="flex-1 print:pt-0">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
