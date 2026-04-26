import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Tarif detay sayfası WCAG color-contrast spot tarama.
 *
 * Yeni componentler (MeasureConverter, StepTimer) entegre edilince
 * yeni renk kombinasyonları geldi (bg-accent-blue/20 + text-accent-blue,
 * bg-success/15 + text-success, bg-primary text-white). Mevcut
 * a11y-audit.spec.ts genel kontrol yapıyor, bu spec sadece color-contrast
 * rule'unu light + dark için tarif detay sayfasında koşar.
 */
const PAGES = [
  { path: "/tarif/adana-kebap", label: "Adana Kebap (timer + measure)" },
];

async function scanContrast(page: Page, theme: "light" | "dark", path: string) {
  if (theme === "dark") {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
  }
  await page.goto(path);
  await page.waitForLoadState("networkidle");

  // MeasureConverter accordion'ı aç (kapalı default, tarama için açık olmalı)
  const converterToggle = page.getByRole("button", {
    name: /Ölçü dönüştürücü|Measure converter/,
  });
  if (await converterToggle.count()) {
    await converterToggle.first().click();
  }

  const results = await new AxeBuilder({ page })
    .options({ runOnly: { type: "rule", values: ["color-contrast"] } })
    .analyze();

  const violations = results.violations.flatMap((v) =>
    v.nodes.map((n) => ({
      target: (n.target?.join(" ") ?? "").slice(0, 120),
      summary: (n.failureSummary ?? "").slice(0, 220),
    })),
  );

  if (violations.length > 0) {
    console.log(`\n[${theme} ${path}] ${violations.length} contrast violation:`);
    for (const v of violations.slice(0, 12)) {
      console.log(`  · ${v.target}`);
      console.log(`    ${v.summary}`);
    }
  } else {
    console.log(`\n[${theme} ${path}] ✓ no contrast violations`);
  }

  return violations.length;
}

for (const { path, label } of PAGES) {
  test(`a11y contrast (light): ${label}`, async ({ page }) => {
    const count = await scanContrast(page, "light", path);
    expect(count, `light ${path} contrast violations`).toBe(0);
  });

  test(`a11y contrast (dark): ${label}`, async ({ page }) => {
    const count = await scanContrast(page, "dark", path);
    expect(count, `dark ${path} contrast violations`).toBe(0);
  });
}
