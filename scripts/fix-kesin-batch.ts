/**
 * Batch fix for 5 high-confidence recipes (Claude + Codex2 joint review):
 * - profiterol: step 3 revised to surface pastacı kreması; 2-group structure
 * - kourabiethes: all 4 ingredients → "Hamur için" (single group)
 * - makroudh: 2 groups (Hamur için / Dolgu ve şerbet için)
 * - dereotlu-kur-somon: cookMinutes 0 → 1420 (24h cure time)
 * - kvass: cookMinutes 10 → 1420 (24h fermentation)
 *
 *   npx tsx scripts/fix-kesin-batch.ts              # dry run
 *   npx tsx scripts/fix-kesin-batch.ts --apply      # write
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const APPLY = process.argv.includes("--apply");

interface GroupFix {
  slug: string;
  ingredientGroups: Record<string, string>;
}

interface TimeFix {
  slug: string;
  prepMinutes?: number;
  cookMinutes?: number;
}

interface StepFix {
  slug: string;
  stepNumber: number;
  newInstruction: string;
  newTimerSeconds?: number | null;
}

const GROUP_FIXES: GroupFix[] = [
  {
    slug: "profiterol",
    ingredientGroups: {
      "Un": "Hamur için",
      "Su": "Hamur için",
      "Tereyağı": "Hamur için",
      "Yumurta": "Hamur için",
      "Süt": "Krema ve kaplama için",
      "Şeker": "Krema ve kaplama için",
      "Çikolata": "Krema ve kaplama için",
    },
  },
  {
    slug: "kourabiethes",
    ingredientGroups: {
      "Un": "Hamur için",
      "Tereyağı": "Hamur için",
      "Badem": "Hamur için",
      "Pudra şekeri": "Hamur için",
    },
  },
  {
    slug: "makroudh",
    ingredientGroups: {
      "İrmik": "Hamur için",
      "Tereyağı": "Hamur için",
      "Susam": "Hamur için",
      "Hurma ezmesi": "Dolgu ve şerbet için",
      "Bal": "Dolgu ve şerbet için",
    },
  },
];

const TIME_FIXES: TimeFix[] = [
  { slug: "dereotlu-kur-somon", cookMinutes: 1420 },
  { slug: "kvass", cookMinutes: 1420 },
];

const STEP_FIXES: StepFix[] = [
  {
    slug: "profiterol",
    stepNumber: 3,
    newInstruction:
      "Süt ve şekeri kaynatıp pastacı kreması hazırlayın, çikolatayı eritin. Topları kremayla doldurup çikolata sosuyla kaplayın.",
  },
];

async function main(): Promise<void> {
  assertDbTarget("fix-kesin-batch");
  console.log(
    `🔧 fix-kesin-batch (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  let totalChanges = 0;

  // ── Group fixes ──
  console.log("--- Ingredient group assignments ---");
  for (const fix of GROUP_FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: {
        id: true,
        ingredients: { select: { id: true, name: true, group: true } },
      },
    });
    if (!recipe) {
      console.error(`  ❌ ${fix.slug} not in DB`);
      continue;
    }
    for (const [name, targetGroup] of Object.entries(fix.ingredientGroups)) {
      const ing = recipe.ingredients.find((i) => i.name === name);
      if (!ing) {
        console.error(`  ❌ ${fix.slug}: ingredient "${name}" not found`);
        continue;
      }
      if (ing.group === targetGroup) continue;
      totalChanges++;
      console.log(
        `  ${fix.slug.padEnd(22)} "${name.padEnd(16)}" (${(ing.group ?? "null").padEnd(22)} → ${targetGroup})`,
      );
      if (APPLY) {
        await prisma.recipeIngredient.update({
          where: { id: ing.id },
          data: { group: targetGroup },
        });
      }
    }
  }

  // ── Time fixes ──
  console.log("\n--- Time metadata ---");
  for (const fix of TIME_FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, prepMinutes: true, cookMinutes: true },
    });
    if (!recipe) {
      console.error(`  ❌ ${fix.slug} not in DB`);
      continue;
    }
    const update: { prepMinutes?: number; cookMinutes?: number } = {};
    if (fix.prepMinutes !== undefined && recipe.prepMinutes !== fix.prepMinutes) {
      update.prepMinutes = fix.prepMinutes;
    }
    if (fix.cookMinutes !== undefined && recipe.cookMinutes !== fix.cookMinutes) {
      update.cookMinutes = fix.cookMinutes;
    }
    if (Object.keys(update).length === 0) continue;
    totalChanges++;
    console.log(
      `  ${fix.slug.padEnd(22)} prep=${recipe.prepMinutes}→${update.prepMinutes ?? recipe.prepMinutes}, cook=${recipe.cookMinutes}→${update.cookMinutes ?? recipe.cookMinutes}`,
    );
    if (APPLY) {
      await prisma.recipe.update({ where: { id: recipe.id }, data: update });
    }
  }

  // ── Step fixes ──
  console.log("\n--- Step instruction revisions ---");
  for (const fix of STEP_FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: {
        id: true,
        steps: { select: { id: true, stepNumber: true, instruction: true } },
      },
    });
    if (!recipe) {
      console.error(`  ❌ ${fix.slug} not in DB`);
      continue;
    }
    const step = recipe.steps.find((s) => s.stepNumber === fix.stepNumber);
    if (!step) {
      console.error(`  ❌ ${fix.slug}: step ${fix.stepNumber} not found`);
      continue;
    }
    if (step.instruction === fix.newInstruction) continue;
    totalChanges++;
    console.log(
      `  ${fix.slug.padEnd(22)} step ${fix.stepNumber}:`,
    );
    console.log(`    OLD: "${step.instruction}"`);
    console.log(`    NEW: "${fix.newInstruction}"`);
    if (APPLY) {
      await prisma.recipeStep.update({
        where: { id: step.id },
        data: { instruction: fix.newInstruction },
      });
    }
  }

  const verb = APPLY ? "Applied" : "Would apply";
  console.log(`\n${verb}: ${totalChanges} change(s)`);
  if (!APPLY) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
