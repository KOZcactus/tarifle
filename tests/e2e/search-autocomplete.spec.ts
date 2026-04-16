/**
 * SearchBar autocomplete E2E — /tarifler sayfasında arama çubuğuna
 * yazınca tarif adı + malzeme önerileri dropdown'u çıkması.
 */
import { test, expect } from "@playwright/test";

test("SearchBar: 2+ karakter yazınca autocomplete dropdown çıkar", async ({
  page,
}) => {
  await page.goto("/tarifler");

  const searchInput = page.getByRole("combobox", { name: /tarif ara/i });
  await expect(searchInput).toBeVisible();

  // 2 karakter yaz — dropdown tetiklenmeli
  await searchInput.fill("ta");

  // Dropdown listbox görünmeli
  await expect(page.getByRole("listbox")).toBeVisible({ timeout: 3000 });

  // En az 1 öneri olmalı
  const options = page.getByRole("option");
  await expect(options.first()).toBeVisible();
});

test("SearchBar: öneri tıklanınca arama yapılır", async ({ page }) => {
  await page.goto("/tarifler");

  const searchInput = page.getByRole("combobox", { name: /tarif ara/i });
  await searchInput.fill("tav");

  // Dropdown bekle
  await expect(page.getByRole("listbox")).toBeVisible({ timeout: 3000 });

  // İlk öneriyi tıkla
  const firstOption = page.getByRole("option").first();
  const optionText = await firstOption.textContent();
  await firstOption.click();

  // URL'de ?q= parametresi olmalı
  await expect(page).toHaveURL(/q=/, { timeout: 5000 });

  // Sayfa hala render olmalı
  await expect(
    page.getByRole("heading", { name: /tarifler/i }),
  ).toBeVisible();
});

test("SearchBar: Escape ile dropdown kapanır", async ({ page }) => {
  await page.goto("/tarifler");

  const searchInput = page.getByRole("combobox", { name: /tarif ara/i });
  await searchInput.fill("do");

  await expect(page.getByRole("listbox")).toBeVisible({ timeout: 3000 });

  // Escape → dropdown kapanır
  await searchInput.press("Escape");
  await expect(page.getByRole("listbox")).not.toBeVisible();
});
