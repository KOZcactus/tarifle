import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  closeTestDb,
  type TestUserSeed,
} from "./helpers/test-user";

/**
 * Full login round-trip: pre-verified user → /giris UI'dan form submit →
 * oturum state'i navbar'da + auth-gated sayfa erişiminde doğrulanır →
 * çıkış yap → login state eski haline döner.
 *
 * Pass 4'te yakaladığımız "kayıttan sonra navbar logged-out görünüyordu"
 * bug sınıfına regression guard. E2E'nin bu tarife değdiği nokta: Auth.js
 * session hydration + SessionProvider refresh'i sadece uçtan uca
 * çalıştırılırken gerçekten tetiklenir.
 *
 * Session'ı UI üzerinden kurduğumuz için `emailVerified: new Date()`
 * önceden set ediliyor (helper bunu zaten yapıyor), test kayıt akışı
 * DEĞIL, login akışını doğruluyor.
 */

let user: TestUserSeed;

test.beforeAll(async () => {
  user = await createTestUser();
});

test.afterAll(async () => {
  if (user) await deleteTestUser(user.userId);
  await closeTestDb();
});

test("login via UI → navbar reflects session → /ayarlar accessible → logout reverts state", async ({ page }) => {
  // 1. Açılışta anonim state, /giris butonu beklenir.
  await page.goto("/");
  await expect(page.getByRole("link", { name: /giriş yap/i })).toBeVisible();

  // 2. /giris'e git, formu doldur, submit et.
  await page.goto("/giris");
  await page.getByLabel(/e-posta/i).fill(user.email);
  await page.getByLabel(/şifre/i).fill(user.password);
  // Form submit button, Google butonu ve navbar link'i de "Giriş Yap"
  // metnini paylaşıyor; locator çakışmasın diye `type="submit"` üzerinden.
  await page.locator('form button[type="submit"]').click();

  // 3. Başarılı login sonrası ana sayfaya dönmeli + navbar logged-in.
  //    "Giriş Yap" butonu artık olmamalı; avatar/profil buton görünmeli.
  await page.waitForURL("/", { timeout: 10_000 });
  await expect(
    page.getByRole("link", { name: /giriş yap/i }),
  ).not.toBeVisible();

  // 4. /ayarlar'a git, auth gate'i geçmeli, /giris'e redirect atmamalı.
  await page.goto("/ayarlar");
  await expect(page).toHaveURL(/\/ayarlar/);
  // Profil ayarları başlığı rendered.
  await expect(
    page.getByRole("heading", { name: /profil ayarları/i }),
  ).toBeVisible();

  // 5. /profil/[username]'e git, kendi profilimiz görünür olmalı.
  await page.goto(`/profil/${user.username}`);
  // Kullanıcı ismi sayfada görünsün (header veya başka yerde). `.first()`
  // çünkü breadcrumb + header aynı ismi iki kere render edebilir.
  await expect(page.getByText(user.name).first()).toBeVisible();

  // 6. Logout: navbar profile menüsünü aç, "Çıkış Yap" tıkla.
  //    aria-controls="profile-menu" tek bu butonda, bell vs.den ayrılır.
  await page.locator('button[aria-controls="profile-menu"]').click();
  await page.getByRole("menuitem", { name: /çıkış yap/i }).click();

  // 7. Logout sonrası: /giris butonu yeniden görünür, /ayarlar anonim
  //    redirect edilir.
  await expect(page.getByRole("link", { name: /giriş yap/i })).toBeVisible({
    timeout: 10_000,
  });

  await page.goto("/ayarlar");
  // Anonim → redirect /giris (callbackUrl ile).
  await expect(page).toHaveURL(/\/giris/);
});
