import { test, expect } from "@playwright/test";

/**
 * Detail page visual regression (oturum 19 P2 paketi).
 *
 * Tarif detay + blog detay sayfaları visual snapshot. Slug listesi sabit
 * 3 popüler tarif + 2 popüler blog (DB'de var olmalı; testlerden önce
 * fixture seed garanti edilmeli).
 *
 * Stabilite: prod'da viewCount sayacı her render'da artıyor olabilir,
 * görsel olarak değişmez ama "viewCount badge" 1 piksel kaymayı
 * tetiklemesin diye fullPage: false viewport only.
 *
 * Random recipe öneren "similar recipes" bölümü dinamik; mask edilebilir.
 */

const RECIPE_SLUGS = [
  "menemen-tarifi", // klasik, mevcut DB'de garantili (eski seed)
  "adana-kebap",
  "domates-corbasi",
];

const BLOG_SLUGS = [
  "et-muhurlemenin-bilimi",
  "kahve-mi-cay-mi-secim-rehberi",
  "diyet-skoru-nasil-hesaplanir",
];

test.describe("Recipe detail visual baseline", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `;
      document.head?.appendChild(style);
    });
  });

  for (const slug of RECIPE_SLUGS) {
    test(`recipe /tarif/${slug} baseline`, async ({ page }) => {
      const res = await page.goto(`/tarif/${slug}`);
      // Tarif silinmiş veya slug değişmişse skip, baseline kirli olmasın
      if (!res || res.status() !== 200) {
        test.skip(true, `slug yok: ${slug}`);
        return;
      }
      await page.waitForLoadState("networkidle", { timeout: 15_000 });

      // Similar recipes bölümünü mask et (dinamik öneri)
      const similarBox = page.locator(
        '[data-testid="similar-recipes"], section:has(h2:text-matches("Benzer", "i"))',
      );

      await expect(page).toHaveScreenshot(`recipe-${slug}.png`, {
        fullPage: false,
        mask: [similarBox],
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});

test.describe("Blog detail visual baseline", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `;
      document.head?.appendChild(style);
    });
  });

  for (const slug of BLOG_SLUGS) {
    test(`blog /blog/${slug} baseline`, async ({ page }) => {
      const res = await page.goto(`/blog/${slug}`);
      if (!res || res.status() !== 200) {
        test.skip(true, `slug yok: ${slug}`);
        return;
      }
      await page.waitForLoadState("networkidle", { timeout: 15_000 });

      await expect(page).toHaveScreenshot(`blog-${slug}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});
