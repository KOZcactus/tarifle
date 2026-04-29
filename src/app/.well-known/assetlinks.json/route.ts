/**
 * Android App Links (assetlinks.json) endpoint.
 *
 * Android App Links altyapısı: kullanıcı tarifle.app linkine tıkladığında
 * eğer Tarifle Android app installed ise, web yerine app içinde açılır.
 *
 * Phase 0'da app yok, bu yüzden boş bir array stub. Phase 0
 * implementation'ında:
 * 1. Google Play Console'da app oluştur, package name al (örn. com.tarifle.app)
 * 2. App Signing certificate SHA-256 fingerprint al (Google Play Console
 *    veya `keytool -list -v -keystore`)
 * 3. statements array'ini doldur, deploy
 * 4. Android sistem cache 24 saat
 *
 * Spec: https://developer.android.com/training/app-links/verify-android-applinks
 *
 * Kontrol: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://tarifle.app
 *
 * Önemli:
 * - URL: /.well-known/assetlinks.json (.json extension VAR!)
 * - Content-Type: application/json
 * - HTTPS zorunlu
 * - Public cache OK (24 saat)
 */
import { NextResponse } from "next/server";

interface AssetLinksStatement {
  relation: string[];
  target: {
    namespace: "android_app" | "web";
    package_name?: string; // android_app
    sha256_cert_fingerprints?: string[]; // android_app
    site?: string; // web
  };
}

export async function GET(): Promise<NextResponse> {
  // Phase 0 stub: app henüz yok, boş statements
  // Production'da package name + sha256 fingerprint ile doldur
  const statements: AssetLinksStatement[] = [
    // PHASE 0 PLACEHOLDER:
    // {
    //   relation: [
    //     "delegate_permission/common.handle_all_urls",
    //     "delegate_permission/common.get_login_creds", // Smart Lock for Passwords
    //   ],
    //   target: {
    //     namespace: "android_app",
    //     package_name: "com.tarifle.app",
    //     sha256_cert_fingerprints: [
    //       // Production keystore (Google Play App Signing)
    //       "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00",
    //       // Debug keystore (development build, opsiyonel)
    //       // "...",
    //     ],
    //   },
    // },
  ];

  return NextResponse.json(statements, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
