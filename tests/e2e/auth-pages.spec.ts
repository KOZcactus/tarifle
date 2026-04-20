import { expect, test } from "@playwright/test";

/**
 * Auth pages smoke, read-only. Confirms both /giris and /kayit render their
 * expected fields + the Google OAuth button. We do NOT submit the forms here
 * because doing so either hits the live DB (register) or locks out a real
 * account (failed logins consume rate-limit tokens). A separate, DB-aware
 * suite should cover actual sign-in round-trips.
 */
test.describe("Auth pages", () => {
  test("/giris renders credentials + Google buttons", async ({ page }) => {
    await page.goto("/giris");

    await expect(page.getByRole("heading", { name: /Giriş Yap/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google ile Giriş Yap/i })).toBeVisible();
    await expect(page.getByLabel(/E-posta/i)).toBeVisible();
    await expect(page.getByLabel(/Şifre/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Giriş Yap$/ })).toBeVisible();
  });

  test("/kayit renders registration form + KVKK checkbox", async ({ page }) => {
    await page.goto("/kayit");

    await expect(page.getByRole("heading", { name: /Kayıt Ol/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google ile Kayıt Ol/i })).toBeVisible();
    await expect(page.getByLabel(/Ad Soyad/i)).toBeVisible();
    await expect(page.getByLabel(/E-posta/i)).toBeVisible();
    await expect(page.getByLabel(/Şifre/i)).toBeVisible();
    await expect(page.getByLabel(/KVKK/i)).toBeVisible();
  });

  test("links between /giris and /kayit work", async ({ page }) => {
    // Scope to the form itself, navbar also has "Giriş Yap" when logged
    // out, which makes an unqualified getByRole ambiguous.
    await page.goto("/giris");
    const loginFormArea = page.locator("main");
    await loginFormArea.getByRole("link", { name: /Kayıt Ol/i }).click();
    await expect(page).toHaveURL(/\/kayit$/);

    const registerFormArea = page.locator("main");
    await registerFormArea.getByRole("link", { name: /Giriş Yap/i }).click();
    await expect(page).toHaveURL(/\/giris$/);
  });
});
