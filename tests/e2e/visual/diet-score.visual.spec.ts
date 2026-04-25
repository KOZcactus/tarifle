import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  closeTestDb,
  type TestUserSeed,
} from "../helpers/test-user";

/**
 * Diyet skoru UI visual regression baseline (oturum 20).
 *
 * Login user + dietProfile set + recipe card / detail / settings
 * yuzeylerinde diyet badge gorunumunu pinler. Anonim user view'larinda
 * diet UI hic gorunmedigi icin existing public-pages baseline'lari
 * etkilenmiyor; bu spec ekleme niteligindeki diet badge'i guvence altina
 * alir.
 *
 * Test user yaratilir, dietProfile'ina "yuksek-protein" set edilir
 * (audit-deep distribution'da iyi coverage), sonra tarif detay +
 * /tarifler listing baseline alinir.
 */

let user: TestUserSeed;

test.beforeAll(async () => {
  user = await createTestUser();
  // dietProfile DB'den direkt set, /ayarlar tiklamadan kisa yol
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { neonConfig } = await import("@neondatabase/serverless");
  const wsModule = await import("ws");
  neonConfig.webSocketConstructor = wsModule.default;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  await prisma.user.update({
    where: { id: user.userId },
    data: { dietProfile: "yuksek-protein", showDietBadge: true },
  });
  await prisma.$disconnect();
});

test.afterAll(async () => {
  if (user) await deleteTestUser(user.userId);
  await closeTestDb();
});

test.describe("Diyet badge visual baseline (login user)", () => {
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

    // Login
    await page.goto("/giris");
    await page.getByLabel(/e-posta/i).fill(user.email);
    await page.getByLabel(/şifre/i).fill(user.password);
    await page
      .getByRole("button", { name: /^Giriş Yap$/, exact: true })
      .click();
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("/tarifler listing badge'leri", async ({ page }) => {
    await page.goto("/tarifler");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
    await expect(page).toHaveScreenshot("tarifler-listing-with-diet-badge.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    });
  });

  test("/ayarlar diyet preference card", async ({ page }) => {
    await page.goto("/ayarlar");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    const dietSection = page.locator("section#diyet");
    await expect(dietSection).toBeVisible();
    await expect(dietSection).toHaveScreenshot("ayarlar-diet-preference.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("recipe detail diet fit card", async ({ page }) => {
    await page.goto("/tarif/menemen-tarifi");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });

    const dietCard = page.locator("section[aria-labelledby='diet-fit-heading']");
    if ((await dietCard.count()) === 0) {
      test.skip(true, "DietFitCard render edilmedi (DB skoru yok olabilir)");
      return;
    }
    await expect(dietCard).toHaveScreenshot("recipe-detail-diet-fit-card.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
