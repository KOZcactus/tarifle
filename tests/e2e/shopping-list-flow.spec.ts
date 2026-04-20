/**
 * Alışveriş listesi end-to-end akışı, manuel madde ekle → checkbox
 * işaretle → "Alındı" bölümüne geçtiğini doğrula → sil → liste boş.
 *
 * Faz 2'de eklenen ShoppingListClient'a regression guard: optimistic
 * update + server action toggle + clear/remove zinciri tek koşuda
 * doğrulanır.
 *
 * Test verisi: createTestUser pre-verified credentials, afterAll
 * ShoppingList cascade siler.
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

test("login → /alisveris-listesi → manuel madde ekle → check → sil", async ({
  page,
}) => {
  // 1. Login (Google + submit aynı text içerir, type=submit ile filter)
  await page.goto("/giris");
  await page.getByLabel(/e-?posta/i).fill(user.email);
  await page.getByLabel(/şifre/i).fill(user.password);
  await page
    .locator('button[type="submit"]')
    .filter({ hasText: /giriş yap/i })
    .click();
  await page.waitForURL("/", { timeout: 10000 });

  // 2. Alışveriş listesi sayfası, başta boş ekran beklenir
  await page.goto("/alisveris-listesi");
  await expect(
    page.getByRole("heading", { name: /alışveriş listem/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/liste boş\. bir tarif aç/i),
  ).toBeVisible();

  // 3. Manuel madde ekle, placeholder ile input bulalım
  await page.getByPlaceholder(/manuel malzeme ekle/i).fill("Tuz");
  await page.getByPlaceholder(/miktar/i).fill("1 paket");
  await page.getByRole("button", { name: /^ekle$/i }).click();

  // 4. Madde "Alınacaklar" bölümünde görünür. Item label "Tuz 1 paket"
  //    şeklinde nested span olarak render edilir; loose substring match.
  await expect(page.getByText(/alınacaklar \(1\)/i)).toBeVisible();
  await expect(page.getByText(/tuz/i).first()).toBeVisible();

  // 5. Page reload, optimistic update sırasında "temp-…" ID kullanan
  //    yeni item'a checkbox/sil disabled veriyor. Reload sonrası
  //    server'dan gerçek ID ile gelir, checkbox enabled olur.
  await page.reload();
  await expect(page.getByText(/tuz/i).first()).toBeVisible();

  // 6. Checkbox işaretle (artık enabled, item server-side ID ile)
  const itemCheckbox = page.getByRole("checkbox").first();
  await expect(itemCheckbox).toBeEnabled();
  await itemCheckbox.click();

  // 7. "Alındı" bölümüne geçti, heading mevcut, item Alındı listesinde.
  await expect(page.getByText(/alındı \(1\)/i)).toBeVisible();

  // 8. Sil butonuna bas (aria-label="Sil")
  await page.getByRole("button", { name: /^sil$/i }).first().click();

  // 9. Liste boşaldı, initial empty state geri geldi
  await expect(page.getByText(/liste boş\. bir tarif aç/i)).toBeVisible({
    timeout: 5000,
  });
});
