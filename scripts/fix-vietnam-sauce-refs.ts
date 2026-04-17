/**
 * Fix 3 Vietnam recipes where servingSuggestion/step referenced a sauce
 * or ingredient not in the ingredient list (Codex2 flag). Chose to revise
 * text-to-match-ingredients rather than adding speculative ingredients:
 *
 * - cao-lau: step 3 "az sosla" → "az soya sosuyla" (soya sosu is in list)
 * - com-tam: 3 groups (Pilav/Et/Servis için) consolidated into 2 (Ana
 *   yemek için / Servis için), servingSuggestion dropped
 *   "turşu havuç + acı sos" references; restored from flatten
 * - bo-luc-lac: Et için singleton merged into Marine için; servingSuggestion
 *   dropped "limonlu karabiber sosu"; restored from flatten
 *
 *   npx tsx scripts/fix-vietnam-sauce-refs.ts              # dry run
 *   npx tsx scripts/fix-vietnam-sauce-refs.ts --apply      # write
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

interface Fix {
  slug: string;
  servingSuggestion?: string;
  stepRevisions?: { stepNumber: number; newInstruction: string }[];
  ingredientGroups?: Record<string, string>;
}

const FIXES: Fix[] = [
  {
    slug: "cao-lau",
    stepRevisions: [
      {
        stepNumber: 3,
        newInstruction:
          "Erişte, et ve taze otları az soya sosuyla kasede birleştirin.",
      },
    ],
  },
  {
    slug: "com-tam",
    servingSuggestion:
      "Pilav, ızgara et, yumurta ve salatalıkla sıcak servis edin.",
    ingredientGroups: {
      "Kırık pirinç": "Ana yemek için",
      "Dana pirzola": "Ana yemek için",
      "Soya sosu": "Ana yemek için",
      "Yumurta": "Servis için",
      "Salatalık": "Servis için",
    },
  },
  {
    slug: "bo-luc-lac",
    servingSuggestion: "Domatesli marul yatağında sıcak servis edin.",
    ingredientGroups: {
      "Dana bonfile": "Marine için",
      "Soya sosu": "Marine için",
      "Sarımsak": "Marine için",
      "Domates": "Servis için",
      "Marul": "Servis için",
    },
  },
];

async function applyFix(fix: Fix, dryRun: boolean): Promise<number> {
  let count = 0;
  const recipe = await prisma.recipe.findUnique({
    where: { slug: fix.slug },
    select: {
      id: true,
      servingSuggestion: true,
      steps: { select: { id: true, stepNumber: true, instruction: true } },
      ingredients: { select: { id: true, name: true, group: true } },
    },
  });
  if (!recipe) {
    console.error(`  ❌ ${fix.slug} not in DB`);
    return 0;
  }

  if (fix.servingSuggestion && recipe.servingSuggestion !== fix.servingSuggestion) {
    count++;
    console.log(`  ${fix.slug} servingSuggestion:`);
    console.log(`    OLD: "${recipe.servingSuggestion}"`);
    console.log(`    NEW: "${fix.servingSuggestion}"`);
    if (!dryRun) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { servingSuggestion: fix.servingSuggestion },
      });
    }
  }

  if (fix.stepRevisions) {
    for (const rev of fix.stepRevisions) {
      const step = recipe.steps.find((s) => s.stepNumber === rev.stepNumber);
      if (!step) {
        console.error(`  ❌ ${fix.slug}: step ${rev.stepNumber} not found`);
        continue;
      }
      if (step.instruction === rev.newInstruction) continue;
      count++;
      console.log(`  ${fix.slug} step ${rev.stepNumber}:`);
      console.log(`    OLD: "${step.instruction}"`);
      console.log(`    NEW: "${rev.newInstruction}"`);
      if (!dryRun) {
        await prisma.recipeStep.update({
          where: { id: step.id },
          data: { instruction: rev.newInstruction },
        });
      }
    }
  }

  if (fix.ingredientGroups) {
    for (const [name, targetGroup] of Object.entries(fix.ingredientGroups)) {
      const ing = recipe.ingredients.find((i) => i.name === name);
      if (!ing) {
        console.error(`  ❌ ${fix.slug}: ingredient "${name}" not found`);
        continue;
      }
      if (ing.group === targetGroup) continue;
      count++;
      console.log(
        `  ${fix.slug} ingredient group: "${name}" (${ing.group ?? "null"} → ${targetGroup})`,
      );
      if (!dryRun) {
        await prisma.recipeIngredient.update({
          where: { id: ing.id },
          data: { group: targetGroup },
        });
      }
    }
  }

  return count;
}

async function main(): Promise<void> {
  assertDbTarget("fix-vietnam-sauce-refs");
  console.log(
    `🔧 fix-vietnam-sauce-refs (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  let total = 0;
  for (const fix of FIXES) {
    total += await applyFix(fix, !APPLY);
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
