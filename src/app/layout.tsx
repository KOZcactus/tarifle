import type { Metadata } from "next";
import { bricolage, geistSans, geistMono } from "@/styles/fonts";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Make Eat`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${bricolage.variable} ${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1 print:pt-0">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
