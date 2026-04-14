import { expect, test } from "@playwright/test";

/**
 * Home page happy path — read-only smoke. Asserts the page loads with the
 * hero, the featured recipe list, and the category grid. If any of these
 * break, the whole front door of the site is down.
 */
test.describe("Home page", () => {
  test("renders hero, featured recipes, and category grid", async ({ page }) => {
    await page.goto("/");

    // Hero H1
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Bugün ne.*pişirsek/i,
    );

    // Search input reachable by its accessible name
    await expect(page.getByRole("textbox", { name: /Tarif ara/i })).toBeVisible();

    // Featured recipes section title
    await expect(
      page.getByRole("heading", { name: /Öne Çıkan Tarifler/i }),
    ).toBeVisible();

    // At least one recipe card renders (Aperol Spritz, Mantı, etc. in the
    // seeded set are marked featured)
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    // Categories section — seeded 17 categories
    await expect(
      page.getByRole("heading", { name: /Kategoriler/i }),
    ).toBeVisible();
  });

  test("AI Assistant banner links to /ai-asistan", async ({ page }) => {
    await page.goto("/");
    // Match by href rather than by name — the banner's accessible name is a
    // long concatenation of emoji + label + heading + CTA; matching on the
    // link target is more resilient to copy tweaks.
    const banner = page.locator('a[href="/ai-asistan"]').first();
    await banner.scrollIntoViewIfNeeded();
    await expect(banner).toBeVisible();
    await banner.click();
    await expect(page).toHaveURL(/\/ai-asistan$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("navigating to /tarifler shows the recipe listing", async ({ page }) => {
    await page.goto("/tarifler");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cards = page.locator("article");
    expect(await cards.count()).toBeGreaterThan(0);
  });
});
