import { test, expect } from "@playwright/test";

/**
 * Visual regression baseline (oturum 19 P2 paketi).
 *
 * Tarifle'nin public sayfalarının görsel snapshot'ı; CSS/component
 * değişiklikleri görsel bozulma yarattı mı yakalar. İlk koşum baseline
 * üretir (`npx playwright test public-pages.visual.spec.ts --update-snapshots`),
 * sonraki koşumlarda diff PR review'da render edilir.
 *
 * Kapsam: anonim user'ın gördüğü 6 public sayfa, desktop default (1280x720).
 * Mobile + dark theme ileri iterasyonda eklenir (FUTURE_PLANS).
 *
 * Stabilite önlemleri:
 *   - Network idle bekle (animasyon + lazy image yüklensin)
 *   - Disable animations (CSS reset ile transition: none)
 *   - Random recipe banner gibi dinamik kısımları mask et
 *   - threshold 0.2 (deploy farkı, font rendering varyasyonu için tolerans)
 *
 * NOT: İlk koşumda baseline yoksa Playwright `toHaveScreenshot` test'i
 * fail eder + baseline oluşturur. CI'da `--update-snapshots` flag'i
 * sadece manuel veya labelli PR'da etkin olmalı (otomatik regenerate
 * regression koruması bypass eder).
 */

test.describe("Public pages visual baseline", () => {
  test.beforeEach(async ({ page }) => {
    // Animasyonları durdur, flaky snapshot'lara karşı kalkan
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head?.appendChild(style);
    });
  });

  test("anasayfa (light theme) baseline", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    // Random Recipe Banner her render'da farklı tarif gösterir; mask et
    const randomBanner = page.locator(
      '[data-testid="random-recipe-banner"], .random-recipe-banner',
    );

    await expect(page).toHaveScreenshot("home-light.png", {
      fullPage: true,
      mask: [randomBanner],
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("/tarifler listing baseline", async ({ page }) => {
    await page.goto("/tarifler");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    await expect(page).toHaveScreenshot("recipes-listing.png", {
      fullPage: false, // viewport only, alt liste pagination zamanla değişir
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("/blog listing baseline", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    await expect(page).toHaveScreenshot("blog-listing.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("/kategoriler baseline", async ({ page }) => {
    await page.goto("/kategoriler");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    await expect(page).toHaveScreenshot("categories.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("/ai-asistan formu baseline", async ({ page }) => {
    await page.goto("/ai-asistan");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    await expect(page).toHaveScreenshot("ai-assistant-form.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("/giris baseline", async ({ page }) => {
    await page.goto("/giris");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    await expect(page).toHaveScreenshot("login.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("/kayit baseline", async ({ page }) => {
    await page.goto("/kayit");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    await expect(page).toHaveScreenshot("register.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("/yasal hub baseline", async ({ page }) => {
    await page.goto("/yasal");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    await expect(page).toHaveScreenshot("legal-hub.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
