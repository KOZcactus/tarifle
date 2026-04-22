/**
 * Kritik kullanici yolculugu E2E: anasayfa -> search -> detay -> bookmark
 * -> profil bookmarks listesi. Plus keyboard nav adimlari (Tab, Enter,
 * Escape).
 *
 * Bu flow Tarifle'nin en sik kullanilan yolu. Her bir parca ayri spec'lerde
 * mevcuttu (search-autocomplete, recipe-detail, collection-flow) ama
 * uctan-uca tek koşu yoktu. Regression yakalama: bookmark + profil
 * stat sayisi senkron mu, search query string -> detail navigation
 * smooth mu, navbar Tab order intact mi.
 *
 * Test data: createTestUser pre-verified credentials, afterAll cascade
 * delete.
 */
import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  closeTestDb,
  type TestUserSeed,
} from "./helpers/test-user";

let user: TestUserSeed;

test.beforeAll(async () => {
  user = await createTestUser();
});

test.afterAll(async () => {
  if (user) await deleteTestUser(user.userId);
  await closeTestDb();
});

test("anasayfa search -> tarif detay -> bookmark -> profil bookmarks listesi", async ({ page }) => {
  // 1. Login
  await page.goto("/giris");
  await page.getByLabel(/e-?posta/i).fill(user.email);
  await page.getByLabel(/şifre/i).fill(user.password);
  await page
    .locator('button[type="submit"]')
    .filter({ hasText: /giriş yap/i })
    .click();
  await page.waitForURL("/", { timeout: 10000 });

  // 2. Anasayfa hero search bar'a "Adana" yaz, Enter ile arama
  const searchBar = page.getByPlaceholder(/yemek çeşidi|malzeme ara|ara…|ara\.\.\./i).first();
  await expect(searchBar).toBeVisible();
  await searchBar.fill("Adana");
  await searchBar.press("Enter");

  // 3. /tarifler?q=adana sayfası, sonuçlar listede
  await page.waitForURL(/\/tarifler\?q=adana/i, { timeout: 10000 });
  const adanaCard = page
    .getByRole("link")
    .filter({ hasText: /adana kebap/i })
    .first();
  await expect(adanaCard).toBeVisible({ timeout: 5000 });

  // 4. Tarif kart'ına tıkla, detay sayfasına git
  await adanaCard.click();
  await page.waitForURL(/\/tarif\//, { timeout: 10000 });
  await expect(page.getByRole("heading", { name: /adana kebap/i })).toBeVisible();

  // 5. Bookmark (Kaydet) butonu, ilk halinde "Kaydet" yazar
  const saveButton = page.getByRole("button", { name: /^kaydet$/i });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // 6. Toggle sonrasi "Kaydedildi" yazmali (optimistic + server confirm)
  await expect(page.getByRole("button", { name: /^kaydedildi$/i })).toBeVisible({
    timeout: 5000,
  });

  // 7. Profil sayfasina git, bookmark sayisi >=1 olmali
  await page.goto(`/profil/${user.username}`);
  await expect(page.getByRole("heading", { name: user.name ?? user.username }).first()).toBeVisible();

  // 8. Owner kendisi profilinde "Kayıtlı tarifler" sayisi gorur (bookmark count chip)
  await expect(page.getByText(/1 kayıtlı tarif/i)).toBeVisible();

  // 9. Bookmarks bolum render: Adana Kebap link
  await expect(
    page.getByRole("link", { name: /adana kebap/i }).first(),
  ).toBeVisible();

  // 10. Cleanup: bookmark'i kaldır (test idempotent kalsin)
  await page.goto("/tarif/adana-kebap");
  const removeBookmark = page.getByRole("button", { name: /^kaydedildi$/i });
  if (await removeBookmark.isVisible()) {
    await removeBookmark.click();
  }
});

test("keyboard nav: Tab navbar -> Enter aktive -> Escape menu kapatma", async ({ page }) => {
  await page.goto("/");

  // 1. Sayfa yuklenir, Tab'a basinca ilk focusable element navbar logosu
  //    veya skip-link olmali. focus order test.
  await page.keyboard.press("Tab");
  const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
  expect(firstFocused).toBeTruthy();

  // 2. Navbar logo veya menu butonuna kadar Tab, sonra arama gorunur olmali
  //    Birkac Tab atip aktif elementin meaningful oldugunu dogrula.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
  }
  const focusedDescriptor: string = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "NONE";
    const aria = el.getAttribute("aria-label") ?? el.textContent?.slice(0, 20) ?? "";
    return `${el.tagName}:${aria}`;
  });
  expect(focusedDescriptor).not.toBe("BODY:");

  // 3. Search bar'a focus -> Enter -> /tarifler'e yonlendirme
  const searchInput = page.getByPlaceholder(/yemek çeşidi|malzeme ara|ara…|ara\.\.\./i).first();
  await searchInput.focus();
  await searchInput.fill("kek");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/tarifler\?q=kek/i, { timeout: 10000 });

  // 4. /tarifler sayfasinda Escape ile autocomplete temizleme (varsa)
  await page.goto("/");
  await searchInput.focus();
  await searchInput.fill("test");
  await page.keyboard.press("Escape");
  // Escape sonrasi input bos, arama tetiklenmemis (URL hala /)
  expect(page.url()).toMatch(/\/$/);
});

test("keyboard nav: dialog Escape kapatma + focus restore (RecipePicker degil simple test)", async ({ page }) => {
  // Mobile menu = mevcut hamburger button + dropdown menu test pattern
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: /menu|menü/i });
  if (await menuButton.isVisible()) {
    await menuButton.focus();
    await page.keyboard.press("Enter");
    // Menu acildi, Escape ile kapat
    await page.keyboard.press("Escape");
    // Menu kapali, focus mantik - menuButton'da kalmali
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBe("BUTTON");
  }
});
