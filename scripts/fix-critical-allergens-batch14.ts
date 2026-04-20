/**
 * Fix CRITICAL allergen gaps surfaced by audit-deep after Codex batch 14 seed.
 * Six slugs had ingredients that implied allergens not declared in their
 * `allergens` array. All legitimate ingredient-implied matches:
 *   Tereyağı → SUT (×4), Yoğurt → SUT (×1), Hardal → HARDAL (×1).
 *
 *   npx tsx scripts/fix-critical-allergens-batch14.ts          # dry run
 *   npx tsx scripts/fix-critical-allergens-batch14.ts --apply  # dev write
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch14.ts --apply --confirm-prod
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

const FIXES: readonly { slug: string; add: Allergen[]; reason: string }[] = [
  { slug: "kayisi-yahni-malatya-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "mafis-tatlisi-balikesir-usulu", add: ["SUT"], reason: "Yoğurt" },
  { slug: "welsh-rarebit-ingiliz-usulu", add: ["HARDAL"], reason: "Hardal" },
  { slug: "bubble-and-squeak-ingiliz-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "otlu-tava-artvin-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "sac-kavurma-rize-usulu", add: ["SUT"], reason: "Tereyağı" },
];

const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
];

async function main(): Promise<void> {
  assertDbTarget("fix-critical-allergens-batch14");
  console.log(
    `🔧 fix-critical-allergens-batch14 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: FIXES.map((f) => f.slug) } },
    select: { id: true, slug: true, allergens: true },
  });

  let willWrite = 0;
  let alreadyClean = 0;

  for (const fix of FIXES) {
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
    willWrite++;
    console.log(
      `  ${recipe.slug.padEnd(38)} [${before.join(",") || "∅"}] → [${after.join(",")}]  (${fix.reason})`,
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
    `\n${verb}: ${willWrite} | Already clean: ${alreadyClean} | Total: ${FIXES.length}`,
  );
  if (!APPLY) console.log("(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
