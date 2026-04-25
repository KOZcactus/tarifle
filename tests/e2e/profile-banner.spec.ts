import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  closeTestDb,
  type TestUserSeed,
} from "./helpers/test-user";

/**
 * Profil eksik tamamla banner E2E (oturum 19 E paketi onboarding polish).
 *
 * Login + bio NULL + avatarUrl NULL durumunda anasayfada banner görünür.
 * "Kapat" tıklayınca localStorage flag set edilir, sonraki page load'da
 * görünmez. Login olmayan kullanıcıda banner hiç render edilmez.
 *
 * Banner kodu: src/components/home/ProfileIncompleteBanner.tsx
 * useSyncExternalStore ile localStorage subscribe (set-state-in-effect
 * anti-pattern yerine). DISMISS_KEY = "tarifle:profile-banner-dismissed"
 */

let user: TestUserSeed;

test.beforeAll(async () => {
  // Yeni kullanıcı default bio + avatarUrl NULL ile oluşturulur,
  // banner condition gereği görünmeli.
  user = await createTestUser();
});

test.afterAll(async () => {
  if (user) await deleteTestUser(user.userId);
  await closeTestDb();
});

test.describe("Profile incomplete banner", () => {
  test("anonim kullanıcıda banner görünmez", async ({ page }) => {
    await page.goto("/");
    // Banner i18n title "Profilini tamamla", anonim user'da render edilmez
    await expect(page.getByText(/Profilini tamamla/i)).not.toBeVisible({
      timeout: 3_000,
    });
  });

  test("login + profil eksik kullanıcıda banner görünür + dismiss çalışır", async ({
    page,
  }) => {
    // Login
    await page.goto("/giris");
    await page.getByLabel(/e-posta/i).fill(user.email);
    await page.getByLabel(/şifre/i).fill(user.password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL("/", { timeout: 10_000 });

    // Banner görünmeli (bio + avatarUrl NULL)
    const banner = page.getByText(/Profilini tamamla/i).first();
    await expect(banner).toBeVisible();

    // CTA "Ayarlar" linki /ayarlar'a yönlendirmeli
    const cta = page.getByRole("link", { name: /Ayarlar/i });
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toBe("/ayarlar");

    // Dismiss: "Kapat" butonu (aria-label) tıkla
    const dismissBtn = page.getByRole("button", { name: /Kapat/i });
    await dismissBtn.click();

    // Banner artık DOM'dan kalkmalı
    await expect(banner).not.toBeVisible({ timeout: 3_000 });

    // localStorage flag set edildi mi
    const flag = await page.evaluate(() =>
      localStorage.getItem("tarifle:profile-banner-dismissed"),
    );
    expect(flag).toBe("1");

    // Sayfa yenile, banner hâlâ kapalı kalmalı (persistence)
    await page.reload();
    await expect(page.getByText(/Profilini tamamla/i)).not.toBeVisible({
      timeout: 3_000,
    });
  });
});
