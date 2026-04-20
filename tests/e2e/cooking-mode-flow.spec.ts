/**
 * Pişirme modu end-to-end akışı, tarif detayında "Pişirme Modunu
 * Başlat" → fullscreen dialog açıldı → step navigation (sonraki/önceki)
 * → close button → dialog kapandı.
 *
 * Pişirme modu MVP 0.3'ün önemli bir parçası (Wake Lock + büyük yazı +
 * timer); regression guard yoktu. Test public, login gerekmez.
 *
 * Wake Lock API headless Chromium'da no-op'a düşer, testi etkilemez,
 * sadece feature degradation (gerçek tarayıcıda pişirirken ekran sönmez).
 */
import { test, expect } from "@playwright/test";

test("tarif detayında pişirme modu aç → step ilerle → kapat", async ({
  page,
}) => {
  await page.goto("/tarif/adana-kebap");
  await expect(
    page.getByRole("heading", { name: "Adana Kebap" }),
  ).toBeVisible();

  // 1. "Pişirme Modunu Başlat" butonu, login gerekmez
  const startButton = page.getByRole("button", {
    name: /pişirme modunu başlat/i,
  });
  await expect(startButton).toBeVisible();
  await startButton.click();

  // 2. Fullscreen dialog açıldı (role="dialog", aria-modal="true")
  const dialog = page.getByRole("dialog", { name: /pişirme modu/i });
  await expect(dialog).toBeVisible();

  // 3. İlk adımda "1" göstergesi görünür (step indicator number)
  await expect(dialog.locator('[class*="rounded-full"]:has-text("1")').first()).toBeVisible();

  // 4. "Sonraki" butonuna bas (footer navigation)
  const nextButton = dialog.getByRole("button", { name: /sonraki/i });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  // 5. Adım 2'ye geçti, "Önceki" artık enabled, dolayısıyla
  //    en az 1 step ilerlediğimizi doğrular
  const prevButton = dialog.getByRole("button", { name: /önceki/i });
  await expect(prevButton).toBeEnabled({ timeout: 5000 });

  // 6. Pişirme modundan çık (X butonu, aria-label "Pişirme modundan çık")
  await dialog.getByRole("button", { name: /pişirme modundan çık/i }).click();

  // 7. Dialog kapandı, "Pişirme Modunu Başlat" butonu tekrar görünür
  await expect(dialog).toBeHidden();
  await expect(startButton).toBeVisible();
});
