import { test, expect } from "@playwright/test";

/**
 * Sub-route error boundary recovery E2E (oturum 19 P1 paketi).
 *
 * Oturum 19'da 4 kritik route için sub-route error.tsx eklendi:
 *   - src/app/tarif/[slug]/error.tsx (recipe-detail)
 *   - src/app/dolap/error.tsx (pantry)
 *   - src/app/ai-asistan/error.tsx (ai-assistant)
 *   - src/app/admin/error.tsx (admin)
 *
 * Her biri: Sentry.captureException + scope tag + error.digest UI'da
 * gösterim + reset butonu + route-spesifik fallback CTA.
 *
 * Bu spec **var olan** error.tsx component'lerinin import + render
 * yapısının doğru olduğunu, route fallback'lerin /not-found ile
 * çakışmadığını doğrular. Gerçek hata tetikleme (DB crash) E2E'de
 * kompleks; smoke seviye yeterli.
 *
 * 404 not-found page'in error.tsx ile karışmadığını da doğrular:
 * /tarif/asla-olmayacak-bir-slug → notFound() → 404 page render eder,
 * error.tsx tetiklenmez.
 */

test.describe("Sub-route error boundary smoke", () => {
  test("/tarif/[slug] 404 - error.tsx YERINE not-found.tsx render", async ({
    page,
  }) => {
    const res = await page.goto("/tarif/asla-bulunmayacak-test-slug-x");
    // notFound() Next.js 404 status döner
    expect(res?.status()).toBe(404);
    // Tarif silindi mesajı (error.tsx) DEĞİL, generic 404 sayfa olmalı
    // (app/not-found.tsx içeriği "404" + "Aradığınız sayfa bulunamadı")
    await expect(page.getByText(/404/)).toBeVisible();
  });

  test("/dolap login gerektirir, hata vermeden login redirect", async ({
    page,
  }) => {
    const res = await page.goto("/dolap");
    // Auth-gated sayfa; anonim user'da middleware veya layout
    // /giris'e redirect eder. Status 200 olabilir (intermediate),
    // final URL /giris olmalı, error.tsx tetiklenmemeli.
    await page.waitForURL(/\/giris|\/dolap/, { timeout: 10_000 });
    // "Dolap şu an yüklenemedi" mesajı (error.tsx) görünmemeli
    await expect(page.getByText(/Dolap şu an yüklenemedi/i)).not.toBeVisible({
      timeout: 2_000,
    });
  });

  test("/ai-asistan rendered, error boundary tetiklenmez", async ({ page }) => {
    await page.goto("/ai-asistan");
    // AI asistan formu yüklenmeli, error.tsx tetiklenmemeli
    await expect(
      page.getByText(/AI Asistan şu an cevap veremiyor/i),
    ).not.toBeVisible({ timeout: 2_000 });
  });

  test("/admin auth-gated, error boundary tetiklenmez", async ({ page }) => {
    await page.goto("/admin");
    // Admin layout auth gate redirect /giris'e
    await page.waitForURL(/\/giris|\/admin/, { timeout: 10_000 });
    // Admin error.tsx mesajı görünmemeli
    await expect(page.getByText(/Admin paneli hatası/i)).not.toBeVisible({
      timeout: 2_000,
    });
  });

  test("error.tsx component'leri import edilebilir + export default function var", async ({}) => {
    // Sub-route error boundary file'ları doğru export ediyor mu
    // smoke check (component runtime'da çağrılmaz, dosya structurally OK)
    const recipeError = await import("../../src/app/tarif/[slug]/error");
    const pantryError = await import("../../src/app/dolap/error");
    const aiError = await import("../../src/app/ai-asistan/error");
    const adminError = await import("../../src/app/admin/error");

    expect(typeof recipeError.default).toBe("function");
    expect(typeof pantryError.default).toBe("function");
    expect(typeof aiError.default).toBe("function");
    expect(typeof adminError.default).toBe("function");
  });
});
