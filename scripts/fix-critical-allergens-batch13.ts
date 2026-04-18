/**
 * Fix CRITICAL allergen gaps surfaced by audit-deep after Codex batch 13 seed.
 * Eight slugs had ingredients that implied allergens not declared in their
 * `allergens` array. All legitimate ingredient-implied matches:
 *   Tereyağı → SUT (×5), Yoğurt → SUT (×1), Çam fıstığı → KUSUYEMIS (×1),
 *   Hardal → HARDAL (×1).
 *
 * Each fix is UNION-add: existing allergens stay, missing ones get appended in
 * canonical order. Source-of-truth (`seed-recipes.ts`) gets the same fix via
 * `sync-allergens-batch13-to-seed.ts` so DB and seed file don't drift.
 *
 *   npx tsx scripts/fix-critical-allergens-batch13.ts          # dry run
 *   npx tsx scripts/fix-critical-allergens-batch13.ts --apply  # dev write
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch13.ts --apply --confirm-prod
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
  { slug: "nigde-sogurmeli-yumurta", add: ["SUT"], reason: "Tereyağı" },
  { slug: "nohutlu-yahni-konya-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "mafis-antalya-usulu", add: ["SUT"], reason: "Yoğurt" },
  { slug: "hamsili-pilav-rize-usulu", add: ["KUSUYEMIS"], reason: "Çam fıstığı" },
  { slug: "iskilip-dolmasi-corum-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "sausage-rolls", add: ["HARDAL"], reason: "Hardal" },
  { slug: "cornish-pasty", add: ["SUT"], reason: "Tereyağı" },
  { slug: "anzac-biscuits", add: ["SUT"], reason: "Tereyağı" },
];

const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
];

async function main(): Promise<void> {
  assertDbTarget("fix-critical-allergens-batch13");
  console.log(
    `🔧 fix-critical-allergens-batch13 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
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
      `  ${recipe.slug.padEnd(36)} [${before.join(",") || "∅"}] → [${after.join(",")}]  (${fix.reason})`,
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
  if (!APPLY) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
