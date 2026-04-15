/**
 * Batch retrofit wrapper. Runs every `retrofit-*` script in the right
 * order so Codex can finish a seed run with a single command instead of
 * remembering which retrofit goes first.
 *
 * Order matters: diet inference reads the allergen set, so allergens
 * must be populated first. Adding a new retrofit? Append it to the
 * `STEPS` array and document the dependency in the comment.
 *
 *   npx tsx scripts/retrofit-all.ts              # apply
 *   npx tsx scripts/retrofit-all.ts --dry-run    # preview every step
 *
 * Each child script is spawned in-process (import + call) so env loading,
 * Prisma clients, and error handling stay consistent.
 */

import { execSync } from "node:child_process";

type Step = {
  label: string;
  script: string;
  /** True if this step depends on a prior retrofit's output being written. */
  dependsOnPrior: boolean;
};

const STEPS: readonly Step[] = [
  {
    label: "Alerjen etiketleri (Recipe.allergens)",
    script: "scripts/retrofit-allergens.ts",
    dependsOnPrior: false,
  },
  {
    label: "Diyet tag'leri (vegan, vejetaryen)",
    script: "scripts/retrofit-diet-tags.ts",
    // Reads allergens to decide vegan status (SUT/YUMURTA/DENIZ_URUNLERI).
    dependsOnPrior: true,
  },
  {
    label: "Sitemap ping (Google + Bing)",
    script: "scripts/ping-sitemap.ts",
    // Best-effort — seed + retrofit tamamlandıktan sonra search engine'lere
    // "sitemap güncellendi" sinyali atar. Ping script kendi içinde
    // failure'ları swallow eder, exit 0 döner; orchestrator hatada zinciri
    // durdurmaz (best-effort flag).
    dependsOnPrior: true,
  },
];

const isDryRun = process.argv.includes("--dry-run");
const flag = isDryRun ? " --dry-run" : "";

console.log(
  `\n🧩 Retrofit orchestrator başlıyor ${isDryRun ? "(dry-run)" : ""}...`,
);
console.log(
  `   ${STEPS.length} adım: ${STEPS.map((s) => s.label).join(" → ")}\n`,
);

for (const [i, step] of STEPS.entries()) {
  console.log(`\n▸ Adım ${i + 1}/${STEPS.length} — ${step.label}`);
  try {
    execSync(`npx tsx ${step.script}${flag}`, {
      stdio: "inherit",
      env: process.env,
    });
  } catch {
    console.error(`\n❌ Adım "${step.label}" başarısız. Zincir durdu.`);
    process.exit(1);
  }
}

console.log(
  `\n✅ Tüm retrofit adımları ${isDryRun ? "kuru-çalıştırma ile " : ""}tamamlandı.`,
);
