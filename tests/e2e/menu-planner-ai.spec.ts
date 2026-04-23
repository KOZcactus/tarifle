/**
 * AI Asistan v4: "Haftalık menüyü AI ile Doldur" happy path.
 *
 * Login yapılmış bir kullanıcı /menu-planlayici sayfasına girer,
 * toolbar'daki "AI ile Doldur" butonuyla modal açar, pantry alanına
 * yaygın malzemeler yazar, "Önerileri oluştur" tıklar, 21-slot
 * preview tablosunu doğrular ve "Uygula" ile mevcut MealPlan'a yazar.
 *
 * Kapsam: UI akışı + server action entegrasyonu + MealPlan upsert.
 * Rule-based planner sonucu gerçek DB'den çeker (dev branch), bu
 * yüzden 2971+ tarif havuzu üzerinde deterministic benzeri davranış
 * bekleriz. Seed'siz çağrı zaman ile değişken olabileceği için
 * "21 slot render edildi" ve "en az 1 slot dolduruldu" yeterli
 * invariant; belirli slug bekleme yapılmaz.
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

test("login → /menu-planlayici → AI ile Doldur → preview → uygula", async ({
  page,
}) => {
  // 1. Login
  await page.goto("/giris");
  await page.getByLabel(/e-?posta/i).fill(user.email);
  await page.getByLabel(/şifre/i).fill(user.password);
  await page
    .locator('button[type="submit"]')
    .filter({ hasText: /giriş yap/i })
    .click();
  await page.waitForURL("/", { timeout: 10000 });

  // 2. Menü Planlayıcı'ya git (authenticated flow)
  await page.goto("/menu-planlayici");
  await expect(
    page.getByRole("heading", { name: /menü planlayıcı/i }),
  ).toBeVisible();

  // 3. Toolbar'daki "AI ile Doldur" butonu görünür + tıklanabilir
  const trigger = page.getByRole("button", { name: /ai ile doldur/i });
  await expect(trigger).toBeVisible();
  await trigger.click();

  // 4. Modal form açıldı, "Haftalık menü öner" başlığı
  await expect(page.getByText(/haftalık menü öner/i)).toBeVisible();

  // 5. Pantry alanına yaygın malzemeler yaz (eşleşme olasılığı yüksek)
  const textarea = page.getByLabel(/evindeki malzemeler/i);
  await textarea.fill(
    "tuz, yumurta, un, süt, tavuk, soğan, domates, pirinç, zeytinyağı, limon",
  );

  // 6. Diyet "Fark etmez" default kalır, staples checkbox default açık
  //    Person count 2 default

  // 7. "Önerileri oluştur" butonu, preview ekranına geçer
  const generateButton = page.getByRole("button", { name: /önerileri oluştur/i });
  await generateButton.click();

  // 8. Preview: en fazla 15 saniye (DB 21 sorgu için), commentary görünür
  await expect(page.getByText(/önizleme/i)).toBeVisible({ timeout: 15000 });

  // 9. Preview tablosunda 7 gün başlığı var
  for (const day of [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
  ]) {
    await expect(page.getByRole("rowheader", { name: day })).toBeVisible();
  }

  // 10. "Menüyü Uygula" tıkla
  const applyButton = page.getByRole("button", { name: /^menüyü uygula$/i });
  await expect(applyButton).toBeVisible();
  await applyButton.click();

  // 11. Modal kapandı (başlık artık görünmüyor), sayfa refresh oldu
  await expect(page.getByText(/haftalık menü öner/i)).not.toBeVisible({
    timeout: 10000,
  });
  await expect(
    page.getByRole("heading", { name: /menü planlayıcı/i }),
  ).toBeVisible();

  // 12. Grid en az bir tarifi dolu göstermeli, "Tarif ekle" butonu 21'den az olmalı
  const addButtons = page.getByRole("button", { name: /tarif ekle/i });
  const addCount = await addButtons.count();
  expect(addCount).toBeLessThan(21);
});
