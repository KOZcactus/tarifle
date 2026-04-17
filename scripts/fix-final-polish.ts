/**
 * Final-polish batch:
 * - lokma-tatlisi: restore 2 groups (Hamur için / Şerbet için) after my
 *   earlier flatten regression; Sıvı yağ goes to Hamur için (frying is
 *   an extension of the dough procedure — same pattern as tulumba)
 * - 5 "iyice" vagueness fixes (RECIPE_FORMAT.md §7.3: vague adverbs
 *   need concrete criteria):
 *   adana-kebap, cig-kofte, haydari, soguk-cay, tarhana-corbasi
 *
 *   npx tsx scripts/fix-final-polish.ts              # dry run
 *   npx tsx scripts/fix-final-polish.ts --apply      # write
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

const LOKMA_GROUPS: Record<string, string> = {
  "Un": "Hamur için",
  "Ilık su": "Hamur için",
  "Kuru maya": "Hamur için",
  "Sıvı yağ": "Hamur için",
  "Şeker": "Şerbet için",
  "Su": "Şerbet için",
  "Limon suyu": "Şerbet için",
};

interface StepFix {
  slug: string;
  stepNumber: number;
  newInstruction: string;
  reason: string;
}

const STEP_FIXES: StepFix[] = [
  {
    slug: "adana-kebap",
    stepNumber: 2,
    newInstruction: "En az 15 dakika yoğurun. Hamur gibi yapışkan bir kıvam almalı.",
    reason: "\"iyice\" gereksiz — süre (15 dk) + kriter (yapışkan) zaten var",
  },
  {
    slug: "cig-kofte",
    stepNumber: 3,
    newInstruction: "En az 20 dakika yoğurun; bulgur elinize yapışmayana kadar devam edin.",
    reason: "\"iyice\" yerine somut kriter (elinize yapışmayana kadar)",
  },
  {
    slug: "haydari",
    stepNumber: 3,
    newInstruction: "Nane ve zeytinyağını ekleyip pürüzsüz kıvam alana kadar karıştırın.",
    reason: "\"iyice karıştırın\" → somut kıvam kriteri",
  },
  {
    slug: "soguk-cay",
    stepNumber: 4,
    newInstruction: "Buzdolabında en az 2 saat soğutun, buzlu servis edin.",
    reason: "\"iyice soğutun\" → somut süre (2 saat)",
  },
  {
    slug: "tarhana-corbasi",
    stepNumber: 1,
    newInstruction: "Tarhanayı 1 bardak soğuk suyla topak kalmayacak şekilde çözün.",
    reason: "\"iyice\" kaldırıldı — zaten \"topak kalmayacak\" kriter var",
  },
];

async function main(): Promise<void> {
  assertDbTarget("fix-final-polish");
  console.log(
    `🔧 fix-final-polish (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  let total = 0;

  // ── lokma-tatlisi group restore ──
  console.log("--- lokma-tatlisi group restore ---");
  const lokma = await prisma.recipe.findUnique({
    where: { slug: "lokma-tatlisi" },
    select: { id: true, ingredients: { select: { id: true, name: true, group: true } } },
  });
  if (lokma) {
    for (const [name, targetGroup] of Object.entries(LOKMA_GROUPS)) {
      const ing = lokma.ingredients.find((i) => i.name === name);
      if (!ing) {
        console.error(`  ❌ lokma-tatlisi: "${name}" not found`);
        continue;
      }
      if (ing.group === targetGroup) continue;
      total++;
      console.log(`  "${name.padEnd(16)}" (${(ing.group ?? "null").padEnd(14)} → ${targetGroup})`);
      if (APPLY) {
        await prisma.recipeIngredient.update({
          where: { id: ing.id },
          data: { group: targetGroup },
        });
      }
    }
  }

  // ── step fixes for "iyice" ──
  console.log("\n--- \"iyice\" step revisions ---");
  for (const fix of STEP_FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, steps: { select: { id: true, stepNumber: true, instruction: true } } },
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
    total++;
    console.log(`  ${fix.slug} step ${fix.stepNumber}  (${fix.reason})`);
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
  console.log(`\n${verb}: ${total} change(s)`);
  if (!APPLY) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
