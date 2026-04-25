import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  closeTestDb,
  type TestUserSeed,
} from "./helpers/test-user";

/**
 * Diyet skoru E2E (oturum 20, DIET_SCORE_PLAN B* hibrit Faz 1A).
 *
 * Smoke test 2 senaryo:
 *   1. Anonim /ayarlar redirect /giris
 *   2. Login + preset secimi save success
 *
 * DietFitCard tarif detayinda gosterimi visual regression test'e
 * birakildi (E2E pre-compute timing flaky); component ayni props ile
 * unit test'lerde kapsanir.
 */

let user: TestUserSeed;

test.beforeAll(async () => {
  user = await createTestUser();
});

test.afterAll(async () => {
  if (user) await deleteTestUser(user.userId);
  await closeTestDb();
});

test.describe("Diyet skoru flow", () => {
  test("anonim kullanici /ayarlar erisimi giris'e yonlenir", async ({ page }) => {
    await page.goto("/ayarlar");
    await page.waitForURL(/\/giris/, { timeout: 10_000 });
  });

  test("login + diyet preset secimi save success", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel(/e-posta/i).fill(user.email);
    await page.getByLabel(/şifre/i).fill(user.password);
    await page.getByRole("button", { name: /^Giriş Yap$/, exact: true }).click();
    await page.waitForURL("/", { timeout: 10_000 });

    await page.goto("/ayarlar");
    const dietSection = page.locator("section#diyet");
    await expect(dietSection).toBeVisible();
    await expect(
      dietSection.getByRole("heading", { name: /Diyet Tercihi/i }),
    ).toBeVisible();

    // 6 preset + 1 "Simdilik yok" = 7 buton
    const presetButtons = dietSection.getByRole("button");
    await expect(presetButtons).toHaveCount(7);

    // "Yuksek Protein" preset sec
    const proteinPreset = dietSection.getByRole("button", {
      name: /Yüksek Protein/i,
    });
    await proteinPreset.click();

    // Success status (role=status, aria-live=polite)
    await expect(dietSection.getByRole("status")).toBeVisible({
      timeout: 8_000,
    });

    // aria-pressed=true selected preset'te
    await expect(proteinPreset).toHaveAttribute("aria-pressed", "true");
  });

  test("PrivacyCard 'Diyet uyumu rozeti' toggle var ve calisiyor", async ({
    page,
  }) => {
    await page.goto("/giris");
    await page.getByLabel(/e-posta/i).fill(user.email);
    await page.getByLabel(/şifre/i).fill(user.password);
    await page.getByRole("button", { name: /^Giriş Yap$/, exact: true }).click();
    await page.waitForURL("/", { timeout: 10_000 });

    await page.goto("/ayarlar");

    // PrivacyCard icinde diyet rozeti toggle (label = "Diyet uyumu rozeti")
    const dietBadgeToggle = page.getByLabel(/Diyet uyumu rozeti/i);
    await expect(dietBadgeToggle).toBeVisible();
    // Default acik (showDietBadge=true DB)
    await expect(dietBadgeToggle).toBeChecked();

    // Kapat (sr-only input, visual span intercepts; force click)
    await dietBadgeToggle.click({ force: true });
    await expect(dietBadgeToggle).not.toBeChecked();

    // Server save reflect, page reload sonra hala kapali kalmali
    await page.reload();
    const reloaded = page.getByLabel(/Diyet uyumu rozeti/i);
    await expect(reloaded).not.toBeChecked();

    // Tekrar ac
    await reloaded.click({ force: true });
    await expect(reloaded).toBeChecked();
  });
});

test.describe("DietProfilePromptBanner", () => {
  test("anonim kullanicida banner gorunmez", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/Diyet tercih ediyor musun/i),
    ).not.toBeVisible({ timeout: 3_000 });
  });
});

