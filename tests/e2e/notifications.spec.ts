import { expect, test } from "@playwright/test";
import {
  closeTestDb,
  createTestUser,
  deleteTestUser,
  getUnreadCount,
  seedNotifications,
  type TestUserSeed,
} from "./helpers/test-user";

/**
 * Full happy path for the notifications feature:
 *   seed a user with 3 unread notifications
 *   log in via the credentials form
 *   bell badge shows "3"
 *   open dropdown → 3 items visible, badge clears (auto mark-read)
 *   DB assertions confirm isRead flipped server-side
 *   navigate to /bildirimler → list renders, filter to "Okunmamış" → empty
 *
 * DB writes happen through the real Neon branch configured in .env.local,
 * so this spec is NOT safe against production. See helpers/test-user.ts.
 */
test.describe("Notifications flow", () => {
  let user: TestUserSeed;

  test.beforeAll(async () => {
    user = await createTestUser();
    await seedNotifications(user.userId, [
      {
        type: "VARIATION_LIKED",
        title: "Birisi uyarlamanı beğendi",
        body: '"Fırın karnıyarık" uyarlamana beğeni geldi.',
        link: "/tarif/karniyarik",
      },
      {
        type: "BADGE_AWARDED",
        title: "🌱 Yeni rozet: İlk Uyarlama",
        body: "İlk uyarlamanı paylaştın.",
        link: "/profil/me",
      },
      {
        type: "REPORT_RESOLVED",
        title: "Raporun sonuçlandı",
        body: "Bildirdiğin içerik incelendi. İçerik kaldırıldı.",
      },
    ]);
  });

  test.afterAll(async () => {
    await deleteTestUser(user.userId);
    await closeTestDb();
  });

  test("shows unread badge, auto-marks read on open, surfaces items in /bildirimler", async ({
    page,
  }) => {
    // 1) Log in via the credentials form.
    await page.goto("/giris");
    await page.getByLabel(/E-posta/i).fill(user.email);
    await page.getByLabel(/Şifre/i).fill(user.password);
    await page.getByRole("button", { name: /^Giriş Yap$/ }).click();
    // Redirects to "/" on success.
    await expect(page).toHaveURL(/\/$/);

    // 2) Bell is visible and the unread badge shows the 3 seeded notifications.
    const bell = page.getByRole("button", { name: /Bildirimler/i });
    await expect(bell).toBeVisible();
    await expect(bell).toHaveAttribute(
      "aria-label",
      /3 okunmamış/i,
    );

    // 3) Open dropdown — all three titles render.
    await bell.click();
    const menu = page.getByRole("menu", { name: /Bildirimler/i });
    await expect(menu).toBeVisible();
    await expect(
      menu.getByText(/uyarlamanı beğendi/i).first(),
    ).toBeVisible();
    await expect(
      menu.getByText(/Yeni rozet: İlk Uyarlama/i).first(),
    ).toBeVisible();
    await expect(
      menu.getByText(/Raporun sonuçlandı/i).first(),
    ).toBeVisible();

    // 4) Opening the dropdown auto-marks unread items. The aria-label on the
    //    bell button flips from "3 okunmamış" to plain "Bildirimler", and the
    //    server-side count should match.
    await expect
      .poll(async () => bell.getAttribute("aria-label"), { timeout: 5000 })
      .toBe("Bildirimler");

    // Server-side truth — mark-read must have landed.
    await expect
      .poll(async () => getUnreadCount(user.userId), { timeout: 5000 })
      .toBe(0);

    // 5) Full inbox page renders and the "Okunmamış" filter is empty.
    await menu.getByRole("link", { name: /Tümünü gör/i }).click();
    await expect(page).toHaveURL(/\/bildirimler$/);
    await expect(
      page.getByRole("heading", { name: /Bildirimler/i }),
    ).toBeVisible();

    // Full list still shows every item, just all-read now.
    await expect(
      page.getByText(/uyarlamanı beğendi/i).first(),
    ).toBeVisible();

    // Filter to unread → empty state.
    await page.getByRole("link", { name: /^Okunmamış$/ }).click();
    await expect(page).toHaveURL(/\/bildirimler\?filter=unread$/);
    await expect(page.getByText(/Okunmamış bildirimin yok/i)).toBeVisible();
  });
});
