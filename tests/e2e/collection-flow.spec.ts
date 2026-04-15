/**
 * Koleksiyon end-to-end akışı — tarif detayında SaveMenu üzerinden
 * yeni koleksiyon oluştur, tarifi içine ekle, /koleksiyon/[id]'ye git,
 * tarif orada görünüyor mu doğrula.
 *
 * Bu flow'a regression guard yoktu (Faz 2'de eklendi, sadece manuel
 * test edilmişti). E2E'nin değdiği nokta: SaveMenu'nun client-side
 * optimistic update + server action toggle + `/koleksiyon/[id]` sayfa
 * render zinciri tek koşuda doğrulanır.
 *
 * Test data: createTestUser pre-verified credentials user; afterAll'da
 * cascading delete (User.collections cascade'i koleksiyon + items'ı
 * da temizler).
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

test("login → tarif detayında yeni koleksiyon oluştur + tarifi ekle → koleksiyon sayfasında görünür", async ({
  page,
}) => {
  // 1. Login — Google butonu da "Giriş Yap" içeriyor, exact match için
  //    submit type ile filtrele.
  await page.goto("/giris");
  await page.getByLabel(/e-?posta/i).fill(user.email);
  await page.getByLabel(/şifre/i).fill(user.password);
  await page.locator('button[type="submit"]').filter({ hasText: /giriş yap/i }).click();
  await page.waitForURL("/", { timeout: 10000 });

  // 2. Bir tarif detayına git (Adana Kebap her zaman var, batch'lerden bağımsız)
  await page.goto("/tarif/adana-kebap");
  await expect(page.getByRole("heading", { name: "Adana Kebap" })).toBeVisible();

  // 3. "Koleksiyon" butonuna tıkla (SaveMenu dropdown trigger)
  await page.getByRole("button", { name: /koleksiyon/i }).click();

  // 4. Dropdown açıldı — "Yeni koleksiyon oluştur" butonu görünür
  const newCollectionButton = page.getByRole("button", {
    name: /yeni koleksiyon oluştur/i,
  });
  await expect(newCollectionButton).toBeVisible();
  await newCollectionButton.click();

  // 5. Inline form input — koleksiyon adı yaz
  const collectionName = `E2E Test ${Date.now().toString().slice(-6)}`;
  await page.getByPlaceholder(/koleksiyon adı/i).fill(collectionName);
  await page.getByRole("button", { name: /^ekle$/i }).click();

  // 6. Toast "kaydedildi" benzeri (success indicator) — strict yapmıyorum,
  //    server action sonrası dropdown kapanır + "1" badge collection
  //    button'ında görünür. Onu doğrula.
  await expect(
    page.locator('button[aria-haspopup="true"]:has-text("Koleksiyon")')
      .locator('span:has-text("1")'),
  ).toBeVisible({ timeout: 5000 });

  // 7. Profile menü açıp koleksiyon sayfasına gidelim — direkt URL bilmiyoruz
  //    çünkü slug auto-generated. Profile sayfasına git, koleksiyon listesi
  //    orada olmalı.
  await page.goto(`/profil/${user.username}`);

  // 8. Yeni koleksiyon profilde görünür mü? (link olarak)
  const collectionLink = page.getByRole("link", { name: collectionName });
  await expect(collectionLink).toBeVisible();
  await collectionLink.click();

  // 9. /koleksiyon/[id] sayfasında Adana Kebap görünür — heading
  //    ya da herhangi bir text olarak (RecipeCard h3 olarak render eder
  //    ama farklı layout'larda div de olabilir, generic getByText daha
  //    sağlam).
  await expect(page.getByText("Adana Kebap").first()).toBeVisible({
    timeout: 5000,
  });
});
