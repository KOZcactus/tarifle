/**
 * Mod F Retrofit CSV üretici.
 *
 * Tüm seed-recipes.ts'yi tarar, step count kuralına uymayan (under-min)
 * tarifleri tespit eder, 27 paket halinde docs/retrofit-step-count-NN.csv
 * dosyalarına yazar.
 *
 * CSV format:
 *   slug, type, currentStepCount, minTarget, maxTarget, currentTitle, currentStepsJson
 *
 * Codex her CSV'yi okur, web kaynağı kontrolü + step genişletme yapar,
 * docs/retrofit-step-count-NN.json teslim eder.
 */

import { recipes } from "./seed-recipes";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const MIN: Record<string, number> = {
  YEMEK: 5,
  CORBA: 5,
  SALATA: 5,
  TATLI: 5,
  KAHVALTI: 5,
  APERATIF: 4,
  ATISTIRMALIK: 4,
  KOKTEYL: 4,
  ICECEK: 3,
  SOS: 3,
};
const MAX: Record<string, number> = {
  YEMEK: 10,
  CORBA: 10,
  SALATA: 8,
  TATLI: 10,
  KAHVALTI: 8,
  APERATIF: 8,
  ATISTIRMALIK: 8,
  KOKTEYL: 6,
  ICECEK: 6,
  SOS: 6,
};

const BATCH_SIZE = 100;
const OUT_DIR = join(process.cwd(), "docs");

// CSV quote helper: tırnak ve virgül içeren alanları "..." ile sar, iç tırnakları çiftle
const q = (v: string): string => {
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};

// Collect violations
type Violation = {
  slug: string;
  type: string;
  currentStepCount: number;
  minTarget: number;
  maxTarget: number;
  title: string;
  stepsJson: string;
};

const violations: Violation[] = [];
recipes.forEach((r) => {
  const min = MIN[r.type] ?? 5;
  const max = MAX[r.type] ?? 10;
  if (r.steps.length < min) {
    violations.push({
      slug: r.slug,
      type: r.type,
      currentStepCount: r.steps.length,
      minTarget: min,
      maxTarget: max,
      title: r.title,
      stepsJson: JSON.stringify(
        r.steps.map((s) => ({
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          timerSeconds: s.timerSeconds ?? null,
        }))
      ),
    });
  }
});

console.log(`Total recipes: ${recipes.length}`);
console.log(`Under-min violations: ${violations.length}`);

// Sort: type gruplarını birlikte tut (Codex tek batch'te benzer işler görsün)
violations.sort((a, b) => {
  if (a.type !== b.type) return a.type.localeCompare(b.type);
  return a.slug.localeCompare(b.slug);
});

// Split into 100-batch packages
const totalBatches = Math.ceil(violations.length / BATCH_SIZE);
console.log(`Total batches (${BATCH_SIZE} per): ${totalBatches}`);

mkdirSync(OUT_DIR, { recursive: true });

const HEADER = "slug,type,currentStepCount,minTarget,maxTarget,currentTitle,currentStepsJson";

for (let i = 0; i < totalBatches; i++) {
  const nn = String(i + 1).padStart(2, "0");
  const slice = violations.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
  const lines = [HEADER];
  slice.forEach((v) => {
    lines.push(
      [
        q(v.slug),
        q(v.type),
        String(v.currentStepCount),
        String(v.minTarget),
        String(v.maxTarget),
        q(v.title),
        q(v.stepsJson),
      ].join(",")
    );
  });
  const path = join(OUT_DIR, `retrofit-step-count-${nn}.csv`);
  writeFileSync(path, lines.join("\n") + "\n", { encoding: "utf8" });
  console.log(`  ${path} (${slice.length} tarif)`);
}

// Tip dağılımı özeti
const typeDist: Record<string, number> = {};
violations.forEach((v) => {
  typeDist[v.type] = (typeDist[v.type] ?? 0) + 1;
});
console.log("\nTip dağılımı (toplam):");
Object.entries(typeDist)
  .sort(([, a], [, b]) => b - a)
  .forEach(([type, count]) => {
    console.log(`  ${type.padEnd(14)} ${String(count).padStart(5)}`);
  });

console.log(`\n${totalBatches} CSV üretildi: docs/retrofit-step-count-01.csv .. retrofit-step-count-${String(totalBatches).padStart(2, "0")}.csv`);
