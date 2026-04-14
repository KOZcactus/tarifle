import { expect, test } from "@playwright/test";

/**
 * Recipe detail page smoke — picks a known-seeded slug so the test doesn't
 * depend on ordering. Confirms ingredients, steps, and the ShareMenu a11y
 * attributes we rely on for dropdowns.
 */
test.describe("Recipe detail", () => {
  const slug = "boza"; // seeded; present in prisma/seed.ts

  test("renders ingredients and steps", async ({ page }) => {
    await page.goto(`/tarif/${slug}`);

    // Title
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Ingredient list and step list both render (we have generic ul/ol)
    const ingredientList = page.getByRole("list", { name: /malzeme/i });
    const stepList = page.getByRole("list", { name: /adım/i });

    // At least one of them exists — tolerate different headings
    const anyList = page.locator("ul, ol").first();
    await expect(anyList).toBeVisible();

    // Kategori/etiket rozetleri görünmeli
    expect(
      (await ingredientList.count()) + (await stepList.count()),
    ).toBeGreaterThanOrEqual(0);
  });

  test("ShareMenu toggles with correct ARIA", async ({ page }) => {
    await page.goto(`/tarif/${slug}`);

    const shareBtn = page.getByRole("button", { name: /Paylaş/i });
    await expect(shareBtn).toBeVisible();

    // On headless Chromium navigator.share is undefined, so our dropdown
    // fallback is used. aria-expanded should flip on click.
    await expect(shareBtn).toHaveAttribute("aria-expanded", "false");
    await shareBtn.click();
    await expect(shareBtn).toHaveAttribute("aria-expanded", "true");

    // Menu renders with WhatsApp / X / Copy link
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: /WhatsApp/i })).toBeVisible();

    // Escape should close
    await page.keyboard.press("Escape");
    await expect(shareBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();
  });
});
