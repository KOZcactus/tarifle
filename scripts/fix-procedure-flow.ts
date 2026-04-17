/**
 * Fix procedure/flow issues flagged by Codex2:
 * - atom-sos: reorder steps (sauce prep BEFORE combining) + add resting step
 * - patatas-bravas: add missing step 4 (plating potatoes with sauce)
 * - vietnam-yumurta-kahvesi: clarify "Krema" → "Yumurta krema" (derived
 *   from eggs+milk+sugar in step 2, not a standalone ingredient)
 *
 *   npx tsx scripts/fix-procedure-flow.ts              # dry run
 *   npx tsx scripts/fix-procedure-flow.ts --apply      # write
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

interface AtomSosFix {
  slug: "atom-sos";
  newSteps: { stepNumber: number; instruction: string; timerSeconds?: number | null }[];
}
interface PatatasBravasFix {
  slug: "patatas-bravas";
  appendStep: { stepNumber: number; instruction: string };
}
interface VietnamFix {
  slug: "vietnam-yumurta-kahvesi";
  stepNumber: number;
  newInstruction: string;
}

async function applyAtomSos(dryRun: boolean): Promise<number> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug: "atom-sos" },
    select: { id: true, steps: { select: { id: true, stepNumber: true, instruction: true } } },
  });
  if (!recipe) return 0;

  const newSteps = [
    { stepNumber: 1, instruction: "Sarımsağı ezip pul biber ve hardalla harmanlayın.", timerSeconds: null },
    { stepNumber: 2, instruction: "Yoğurt ve mayonezi bu karışımla çırpıp tuzlayın.", timerSeconds: null },
    { stepNumber: 3, instruction: "Buzdolabında 15 dakika dinlendirip servis edin.", timerSeconds: 900 },
  ];

  // Check if already in target state
  if (
    recipe.steps.length === 3 &&
    recipe.steps.every(
      (s, idx) => s.instruction === newSteps[idx].instruction,
    )
  ) {
    console.log("  atom-sos already in target state");
    return 0;
  }

  console.log("  atom-sos — replacing step list:");
  for (const s of newSteps) console.log(`    ${s.stepNumber}. ${s.instruction}`);

  if (!dryRun) {
    await prisma.$transaction([
      prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } }),
      prisma.recipeStep.createMany({
        data: newSteps.map((s) => ({ recipeId: recipe.id, ...s })),
      }),
    ]);
  }
  return newSteps.length;
}

async function applyPatatasBravas(dryRun: boolean): Promise<number> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug: "patatas-bravas" },
    select: { id: true, steps: { select: { stepNumber: true, instruction: true } } },
  });
  if (!recipe) return 0;

  const step4 = {
    stepNumber: 4,
    instruction:
      "Kızarmış patatesleri servis tabağına alıp acılı domates sosunu üzerine gezdirin.",
  };
  const existing4 = recipe.steps.find((s) => s.stepNumber === 4);
  if (existing4 && existing4.instruction === step4.instruction) {
    console.log("  patatas-bravas step 4 already present");
    return 0;
  }

  console.log(`  patatas-bravas — adding step 4: "${step4.instruction}"`);
  if (!dryRun) {
    await prisma.recipeStep.create({
      data: { recipeId: recipe.id, ...step4 },
    });
  }
  return 1;
}

async function applyVietnam(dryRun: boolean): Promise<number> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug: "vietnam-yumurta-kahvesi" },
    select: { id: true, steps: { select: { id: true, stepNumber: true, instruction: true } } },
  });
  if (!recipe) return 0;

  const step = recipe.steps.find((s) => s.stepNumber === 3);
  if (!step) return 0;

  const newInstruction = "Yumurta kremasını kahvenin üzerine kaşıkla yerleştirin.";
  if (step.instruction === newInstruction) {
    console.log("  vietnam-yumurta-kahvesi step 3 already clarified");
    return 0;
  }

  console.log(`  vietnam-yumurta-kahvesi step 3:`);
  console.log(`    OLD: "${step.instruction}"`);
  console.log(`    NEW: "${newInstruction}"`);
  if (!dryRun) {
    await prisma.recipeStep.update({
      where: { id: step.id },
      data: { instruction: newInstruction },
    });
  }
  return 1;
}

async function main(): Promise<void> {
  assertDbTarget("fix-procedure-flow");
  console.log(
    `🔧 fix-procedure-flow (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const dryRun = !APPLY;
  let total = 0;
  total += await applyAtomSos(dryRun);
  total += await applyPatatasBravas(dryRun);
  total += await applyVietnam(dryRun);

  const verb = APPLY ? "Applied" : "Would apply";
  console.log(`\n${verb}: ${total} change(s)`);
  if (dryRun) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
