/**
 * Uyarlama (variation) end-to-end akışı, login → tarif detayında
 * "Uyarlama Ekle" formu doldur + submit → uyarlama listede görünür →
 * sahibi olarak "Sil" butonuna bas → variation kaybolur.
 *
 * Faz 2 + Pass 8'de eklenen variation create + delete-own akışına
 * regression guard. Like action'ı (toggleLikeAction) backend'de var ama
 * UI'da expose edilmemiş, like flow E2E'si yazılamadı, görsel beğeni
 * butonu eklendiğinde test buraya genişletilebilir.
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
  if (user) {
    // Variation.author FK'da onDelete cascade YOK (kasıtlı, user
    // içeriği koruma). Test başarısız olup variation kalırsa user
    // delete patlar; o yüzden user'ın tüm variation'larını önce sil.
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaNeon } = await import("@prisma/adapter-neon");
    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL!,
    });
    const prisma = new PrismaClient({ adapter });
    await prisma.variation.deleteMany({ where: { authorId: user.userId } });
    await prisma.$disconnect();

    await deleteTestUser(user.userId);
  }
  await closeTestDb();
});

test("login → uyarlama ekle → listede görünür → kendi uyarlamasını sil", async ({
  page,
}) => {
  // window.confirm browser dialog'u açar (DeleteOwnVariationButton içinde),
  // Playwright dialog'u otomatik dismiss eder. Auto-accept'e set et.
  page.on("dialog", (dialog) => dialog.accept());

  // 1. Login
  await page.goto("/giris");
  await page.getByLabel(/e-?posta/i).fill(user.email);
  await page.getByLabel(/şifre/i).fill(user.password);
  await page
    .locator('button[type="submit"]')
    .filter({ hasText: /giriş yap/i })
    .click();
  await page.waitForURL("/", { timeout: 10000 });

  // 2. Bir tarife git (Adana Kebap her ortamda var)
  await page.goto("/tarif/adana-kebap");
  await expect(page.getByRole("heading", { name: "Adana Kebap" })).toBeVisible();

  // 3. "Uyarlama Ekle" butonu, login'liyiz, dropdown form trigger'ı
  await page.getByRole("button", { name: /\+ uyarlama ekle/i }).click();

  // 4. Form alanlarını doldur
  const miniTitle = `E2E ${Date.now().toString().slice(-6)}`;
  await page.getByLabel(/başlık|mini.?title/i).first().fill(miniTitle);
  await page.getByPlaceholder(/kısa bir açıklama/i).fill("E2E test variation");

  // Malzeme satırı: amount + name (ilk satır default boş gelir)
  await page.getByLabel(/malzeme 1 miktarı/i).fill("2");
  await page.getByLabel(/malzeme 1 adı/i).fill("Domates");

  // Adımlar (textarea)
  await page
    .getByPlaceholder(/patlıcanları boyuna/i)
    .fill("E2E test adımı 1\nE2E test adımı 2");

  // 5. Submit
  await page.getByRole("button", { name: /uyarlamayı ekle/i }).click();

  // 6. Success state, "Uyarlamanız eklendi!" veya pending review mesajı
  await expect(
    page
      .getByText(/uyarlamanız eklendi/i)
      .or(page.getByText(/uyarlaman alındı/i)),
  ).toBeVisible({ timeout: 10000 });

  // 7. Sayfa reload, yeni uyarlama variation listesinde görünür
  //    (pending review ise gözükmez ama happy path PUBLISHED)
  await page.reload();

  // Variation card collapse durumunda, miniTitle h3 olarak görünür
  const variationHeading = page.getByRole("heading", { name: miniTitle });
  await expect(variationHeading).toBeVisible({ timeout: 5000 });

  // 8. Variation card'ı aç (toggle)
  await variationHeading.click();

  // 9. Bonus, kendi uyarlamamızda LikeButton "isOwnVariation" pattern'i
  //    nedeniyle salt-okunur ❤️ N gösteriyor. Başka bir variation
  //    olduğunda tıklanabilir; bu test sahibi olduğu için sadece sayı
  //    görünür. Like UI eklendiğini doğrulamak için varlığını kontrol et.
  await expect(
    page.getByLabel(/^\d+ beğeni$/i).first(),
  ).toBeVisible();

  // 10. "Sil" butonu görünür, DeleteOwnVariationButton aria-label
  //    olarak `${miniTitle} uyarlamasını sil` kullanır. Dialog handler
  //    yukarıda ayarlandı, confirm() otomatik accept oluyor.
  const deleteButton = page.getByRole("button", {
    name: new RegExp(`${miniTitle}.*sil`, "i"),
  });
  await deleteButton.click();

  // 10. Variation listeden kayboldu (server action + router.refresh sonrası)
  await expect(variationHeading).toBeHidden({ timeout: 10000 });
});
