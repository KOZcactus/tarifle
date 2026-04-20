/**
 * Fix CRITICAL audit-deep findings surfaced after Codex batch 16 + 17 seed.
 *
 * Six ALLERGEN_ACCURACY criticals, ingredient list implies allergens not
 * declared. Trend continues (batch 15'te 6, burada 6).
 *
 * Categorical sources:
 *   Un → GLUTEN: 1 slug (Diyarbakır nohutlu yoğurt çorbası)
 *   Tereyağı → SUT: 1 slug (Bingöl nohutlu keşkek)
 *   Süt → SUT: 1 slug (Avustralya sweetcorn fritter stack)
 *   Kestane/Ceviz → KUSUYEMIS: 2 slug (Bursa sütlaç, Erzincan dut pekmezli lor)
 *   Yulaf kırıntısı → GLUTEN: 1 slug (İsveç lingonberry parfe)
 *
 *   npx tsx scripts/fix-critical-allergens-batch16-17.ts             # dry run
 *   npx tsx scripts/fix-critical-allergens-batch16-17.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch16-17.ts --apply --confirm-prod
 */
import { PrismaClient, type Allergen } from "@prisma/client";
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

const ALLERGEN_FIXES: readonly {
  slug: string;
  add: Allergen[];
  reason: string;
}[] = [
  { slug: "nohutlu-yogurt-corbasi-diyarbakir-usulu", add: ["GLUTEN"], reason: "Un" },
  { slug: "nohutlu-keskek-bingol-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "kestaneli-sutlac-bursa-usulu", add: ["KUSUYEMIS"], reason: "Kestane (tree-nut class)" },
  { slug: "sweetcorn-fritter-stack-avustralya-usulu", add: ["SUT"], reason: "Süt" },
  { slug: "dut-pekmezli-lor-kup-erzincan-usulu", add: ["KUSUYEMIS"], reason: "Ceviz" },
  { slug: "lingonberry-yogurt-parfe-isvec-usulu", add: ["GLUTEN"], reason: "Yulaf kırıntısı (cross-contamination)" },
];

const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN",
  "SUT",
  "YUMURTA",
  "KUSUYEMIS",
  "YER_FISTIGI",
  "SOYA",
  "DENIZ_URUNLERI",
  "SUSAM",
  "KEREVIZ",
  "HARDAL",
];

async function main(): Promise<void> {
  assertDbTarget("fix-critical-allergens-batch16-17");
  console.log(
    `🔧 fix-critical-allergens-batch16-17 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: ALLERGEN_FIXES.map((f) => f.slug) } },
    select: { id: true, slug: true, allergens: true },
  });

  let updated = 0;
  let alreadyClean = 0;

  for (const fix of ALLERGEN_FIXES) {
    const recipe = recipes.find((r) => r.slug === fix.slug);
    if (!recipe) {
      console.error(`❌ Slug not in DB: ${fix.slug}`);
      continue;
    }
    const current = new Set<Allergen>(recipe.allergens as Allergen[]);
    const before = ALLERGEN_ORDER.filter((a) => current.has(a));
    for (const a of fix.add) current.add(a);
    const after = ALLERGEN_ORDER.filter((a) => current.has(a));

    if (after.length === before.length) {
      alreadyClean++;
      continue;
    }
    updated++;
    console.log(
      `  ${recipe.slug.padEnd(55)} [${before.join(",") || "∅"}] → [${after.join(",")}]  (${fix.reason})`,
    );
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { allergens: after },
      });
    }
  }

  const verb = APPLY ? "Updated" : "Would update";
  console.log(
    `\n${verb}: ${updated} | Already clean: ${alreadyClean} | Total: ${ALLERGEN_FIXES.length}`,
  );
  if (!APPLY) console.log("(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
