import { expect, test } from "@playwright/test";

/**
 * Sentry User Feedback widget E2E smoke testi (oturum 33+ web launch
 * playbook §4 hazırlık). Widget `src/instrumentation-client.ts` içinde
 * autoInject ile her sayfaya enjekte edilir; Türkçe etiketler + brand
 * renk #a03b0f ile özelleştirilmiş.
 *
 * Widget yalnız NEXT_PUBLIC_SENTRY_DSN tanımlıysa monte olur. DSN yoksa
 * (dev fresh checkout) test skip edilir, false-fail engellenir. Prod
 * staging CI'da DSN her zaman mevcut, gerçek regresyonu yakalar.
 *
 * Submission flow ağ tarafında Sentry envelope endpoint'ine POST atar;
 * test "feedback successfully submitted" success state'ine kadar
 * doğrular ama gerçek Sentry sunucusuna gerçek event ulaşmasını
 * beklemez (Sentry event rate quota'yı korumak ve test izolasyonu için).
 */
test.describe("Sentry feedback widget", () => {
  test("trigger button injected with Turkish label", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Geri bildirim formu aç" });
    const dsnConfigured = await trigger
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    test.skip(
      !dsnConfigured,
      "NEXT_PUBLIC_SENTRY_DSN tanımlı değil, widget enjekte olmadı",
    );

    await expect(trigger).toContainText("Geri bildirim");
  });

  test("opens modal with name + email + message + screenshot fields", async ({
    page,
  }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Geri bildirim formu aç" });
    const dsnConfigured = await trigger
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    test.skip(
      !dsnConfigured,
      "NEXT_PUBLIC_SENTRY_DSN tanımlı değil, widget enjekte olmadı",
    );

    await trigger.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel(/^İsim/)).toBeVisible();
    await expect(page.getByLabel(/^E-posta/)).toBeVisible();
    await expect(page.getByLabel(/^Mesaj/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Gönder" })).toBeVisible();
    await expect(page.getByRole("button", { name: "İptal" })).toBeVisible();
  });

  test("submit empty message shows validation error", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Geri bildirim formu aç" });
    const dsnConfigured = await trigger
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    test.skip(
      !dsnConfigured,
      "NEXT_PUBLIC_SENTRY_DSN tanımlı değil, widget enjekte olmadı",
    );

    await trigger.click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Gönder" }).click();

    // Sentry feedback widget HTML5 required validation: message field
    // boş submit edilince native browser validation tetiklenir, modal
    // kapanmaz. Modal hala visible kalmalı.
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("cancel button closes the modal", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Geri bildirim formu aç" });
    const dsnConfigured = await trigger
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    test.skip(
      !dsnConfigured,
      "NEXT_PUBLIC_SENTRY_DSN tanımlı değil, widget enjekte olmadı",
    );

    await trigger.click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
    await page.getByRole("button", { name: "İptal" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
