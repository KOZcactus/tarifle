/**
 * Apple App Site Association (AASA) endpoint.
 *
 * iOS Universal Links altyapısı: kullanıcı tarifle.app linkine tıkladığında
 * eğer Tarifle iOS app installed ise, web yerine app içinde açılır.
 *
 * Phase 0'da app yok, bu yüzden boş bir applinks ile stub. Phase 0
 * implementation'ında:
 * 1. Apple Developer'da app ID al (örn. ABCD12EFGH.com.tarifle.app)
 * 2. paths array'ine app içinde handle edilecek URL pattern'leri ekle
 * 3. Production'a deploy et, Apple AASA cache 24 saate kadar tutar
 *
 * Spec: https://developer.apple.com/documentation/xcode/supporting-associated-domains
 *
 * Kontrol: https://branch.io/resources/aasa-validator/
 *
 * Önemli:
 * - URL: /.well-known/apple-app-site-association (NO .json extension!)
 * - Content-Type: application/json (Apple zorunlu kılar)
 * - HTTPS zorunlu
 * - Redirect YASAK (200 direct response)
 */
import { NextResponse } from "next/server";

interface AppLinkDetail {
  appID?: string; // Legacy, single app
  appIDs?: string[]; // Modern (iOS 15+), multiple apps
  paths?: string[]; // Legacy
  components?: Array<{
    "/"?: string;
    "?": Record<string, string>;
    "#"?: string;
    exclude?: boolean;
  }>;
}

interface AasaPayload {
  applinks: {
    apps?: string[]; // Legacy, deprecated
    details: AppLinkDetail[];
  };
  webcredentials?: {
    apps: string[];
  };
}

export async function GET(): Promise<NextResponse> {
  // Phase 0 stub: app henüz yok, boş applinks
  // Production'da Apple Developer Team ID + Bundle ID ile doldur
  const payload: AasaPayload = {
    applinks: {
      apps: [],
      details: [
        // PHASE 0 PLACEHOLDER:
        // {
        //   appIDs: ["ABCD12EFGH.com.tarifle.app"],  // Team ID + Bundle ID
        //   components: [
        //     { "/": "/tarif/*", "?": { "open": "yes" } },  // Recipe detail
        //     { "/": "/blog/*" },                              // Blog post
        //     { "/": "/profil/*" },                            // User profile
        //     { "/": "/kategoriler", exclude: false },         // Listing
        //     { "/": "/admin/*", exclude: true },              // Admin web only
        //     { "/": "/api/*", exclude: true },                // API web only
        //     { "/": "/_next/*", exclude: true },              // Next assets
        //     { "/": "/.well-known/*", exclude: true },        // This route
        //   ],
        // },
      ],
    },
    // PHASE 0 PLACEHOLDER (passwords autofill from Safari → app):
    // webcredentials: {
    //   apps: ["ABCD12EFGH.com.tarifle.app"],
    // },
  };

  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Apple cache: 24 saat default, biz 1 saat veriyoruz (Phase 0
      // değişiklik yapacağız)
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// Force dynamic, edge cache override (Apple validator cache hassas)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
