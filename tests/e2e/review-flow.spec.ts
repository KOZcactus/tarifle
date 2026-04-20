/**
 * Review (yıldız + yorum) end-to-end akışı, login → tarif detayında
 * yıldız seç + yorum yaz + submit → liste/summary güncellenir → edit →
 * delete.
 *
 * Faz 3 Review v2 kapsamında yazıldı. Preflight flag yolunu (PENDING_REVIEW)
 * happy path'ten ayrı tutmak gerekiyorsa ileride ikinci test eklenebilir,
 * bu test "temiz içerik tek upsert + sil" akışına regression guard.
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
    // Review FK'si Cascade olsa da explicit cleanup testlerin birbirini
    // bozmasını önler (aynı userId'de kalan kayıt sonraki testte @@unique
    // constraint'i tetiklerdi).
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaNeon } = await import("@prisma/adapter-neon");
    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL!,
    });
    const prisma = new PrismaClient({ adapter });
    await prisma.review.deleteMany({ where: { userId: user.userId } });
    await prisma.$disconnect();

    await deleteTestUser(user.userId);
  }
  await closeTestDb();
});

test("login → yıldız + yorum bırak → listede görünür → düzenle → sil", async ({
  page,
}) => {
  // DeleteOwnReviewButton confirm() tetikleniyor, otomatik accept.
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

  // 2. Tarife git
  await page.goto("/tarif/adana-kebap");
  await expect(page.getByRole("heading", { name: "Adana Kebap" })).toBeVisible();

  // 3. Review bölümüne scroll et (RSC render ediyor, DOM'da zaten var)
  const reviewsHeading = page.getByRole("heading", {
    name: /yıldız.*yorumlar/i,
  });
  await reviewsHeading.scrollIntoViewIfNeeded();
  await expect(reviewsHeading).toBeVisible();

  // 4. 4. yıldıza bas, StarRating radiogroup, her yıldız ayrı radio
  //    Interactive modda "4 yıldız" aria-label'ı var.
  const fourthStar = page
    .getByRole("radio", { name: /4 yıldız/i })
    .first();
  await fourthStar.click();

  // 5. Yorum yaz
  const comment = `E2E review ${Date.now().toString().slice(-6)}, temiz içerik.`;
  await page.getByPlaceholder(/neyi sevdin/i).fill(comment);

  // 6. Submit
  await page.getByRole("button", { name: /^gönder$/i }).click();

  // 7. router.refresh sonrası yorum listede görünür, sayfa reload etmeden
  //    Playwright async UI'ı bekler
  await expect(page.getByText(comment)).toBeVisible({ timeout: 10000 });

  // 8. Summary count güncellendi, başlıkta (N) sayısı artmış olmalı
  //    ("Yıldız & Yorumlar (N)" pattern)
  await expect(
    page.getByRole("heading", { name: /yıldız.*yorumlar.*\(\d+\)/i }),
  ).toBeVisible();

  // 9. Form artık "Yorumunu düzenle" moduna geçti (existing var)
  await expect(page.getByText(/yorumunu düzenle/i)).toBeVisible();

  // 10. Edit, yıldızı 5'e çıkar, yorumu güncelle, Güncelle butonuna bas
  const fifthStar = page
    .getByRole("radio", { name: /5 yıldız/i })
    .first();
  await fifthStar.click();

  const updated = `${comment} (güncellendi)`;
  await page.getByPlaceholder(/neyi sevdin/i).fill(updated);
  await page.getByRole("button", { name: /güncelle/i }).click();

  await expect(page.getByText(updated)).toBeVisible({ timeout: 10000 });

  // 11. Delete, DeleteOwnReviewButton içeriği "Sil". Reviews section'a
  //     scope'la (yorumun kendi listesinde yalnız bir Sil butonu var,
  //     tarif detayındaki diğer Sil butonları uyarlamalara ait).
  const reviewsSection = page.locator("section").filter({ has: reviewsHeading });
  await reviewsSection
    .getByRole("button", { name: /^sil$/i })
    .click();

  // Sonrası: review list'indeki <p> / <li> kaybolmalı. Form textarea'sında
  // metin hâlâ kalıyor (component unmount olmuyor), o yüzden list item
  // üzerinden kontrol et, tüm sayfa üzerinden değil.
  await expect(
    reviewsSection.locator("li").filter({ hasText: updated }),
  ).toBeHidden({ timeout: 10000 });
});
