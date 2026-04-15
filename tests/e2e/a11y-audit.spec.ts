import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES_TO_SCAN: { path: string; label: string }[] = [
  { path: "/", label: "Homepage" },
  { path: "/tarifler", label: "Tarifler (list)" },
  { path: "/tarif/baklava", label: "Tarif detay (Baklava — grouped)" },
  { path: "/tarif/adana-kebap", label: "Tarif detay (Adana — flat)" },
  { path: "/ai-asistan", label: "AI Asistan" },
  { path: "/giris", label: "Giriş" },
  { path: "/kayit", label: "Kayıt" },
  { path: "/sifremi-unuttum", label: "Şifremi unuttum" },
  { path: "/kesfet", label: "Keşfet" },
  { path: "/hakkimizda", label: "Hakkımızda" },
];

/**
 * Shared audit runner — both light and dark tests share this. Failure
 * mode is identical: aggregate all violations across PAGES_TO_SCAN and
 * assert zero critical/serious nodes.
 */
async function auditAllPages(page: Page, theme: "light" | "dark") {
  if (theme === "dark") {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
  }

  type Finding = {
    id: string;
    impact: string;
    help: string;
    pages: Set<string>;
    samples: { selector: string; message: string }[];
  };
  const findings = new Map<string, Finding>();
  let totalCritical = 0;

  for (const { path, label } of PAGES_TO_SCAN) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    for (const v of results.violations) {
      const existing = findings.get(v.id);
      const newSamples = v.nodes.slice(0, 3).map((n) => ({
        selector: (n.target?.join(" ") ?? "").slice(0, 120),
        message: (n.any?.[0]?.message ?? "").slice(0, 240),
      }));
      if (existing) {
        existing.pages.add(label);
        for (const s of newSamples) {
          if (
            existing.samples.length < 5 &&
            !existing.samples.some((x) => x.selector === s.selector)
          ) {
            existing.samples.push(s);
          }
        }
      } else {
        findings.set(v.id, {
          id: v.id,
          impact: v.impact ?? "unknown",
          help: v.help,
          pages: new Set([label]),
          samples: newSamples,
        });
      }
      if (v.impact === "critical" || v.impact === "serious") {
        totalCritical += v.nodes.length;
      }
    }
  }

  const sorted = [...findings.values()].sort((a, b) => {
    const order: Record<string, number> = {
      critical: 0,
      serious: 1,
      moderate: 2,
      minor: 3,
    };
    return (order[a.impact] ?? 9) - (order[b.impact] ?? 9);
  });

  console.log(
    `\n━━ A11Y AUDIT [${theme.toUpperCase()}] — ${PAGES_TO_SCAN.length} pages scanned ━━`,
  );
  if (sorted.length === 0) {
    console.log("  ✓ No violations found.");
  } else {
    for (const f of sorted) {
      const mark =
        f.impact === "critical" ? "×" : f.impact === "serious" ? "!" : "·";
      console.log(
        `\n  ${mark} [${f.impact.toUpperCase()}] ${f.id} — ${f.help}`,
      );
      console.log(`     on pages: ${[...f.pages].join(", ")}`);
      for (const s of f.samples) {
        console.log(`     · ${s.selector}`);
        if (s.message) console.log(`       ${s.message}`);
      }
    }
  }
  console.log(`\n━━ Total critical/serious nodes: ${totalCritical} ━━\n`);

  expect(
    totalCritical,
    `${theme}: ${totalCritical} critical/serious a11y node violations`,
  ).toBe(0);
}

test("a11y (light): zero critical/serious violations", async ({ page }) => {
  await auditAllPages(page, "light");
});

test("a11y (dark): zero critical/serious violations", async ({ page }) => {
  await auditAllPages(page, "dark");
});
