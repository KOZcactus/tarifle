/**
 * Fix CRITICAL allergen gaps surfaced by audit-deep after Codex batch 11 seed.
 * Nine slugs had ingredients that implied allergens not declared in their
 * `allergens` array (Tereyağı → SUT, Tahin → SUSAM, Yulaf/Dövme buğday → GLUTEN).
 * Each fix is UNION-add: existing allergens stay, missing ones get appended in
 * canonical order. Source-of-truth (`seed-recipes.ts`) gets the same fix in a
 * separate edit so DB and seed file don't drift.
 *
 *   npx tsx scripts/fix-critical-allergens-batch11.ts          # dry run
 *   npx tsx scripts/fix-critical-allergens-batch11.ts --apply  # write
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
  { slug: "toyga-corbasi-anadolu-usulu", add: ["GLUTEN"], reason: "Dövme buğday" },
  { slug: "elmali-kefir-smoothie", add: ["GLUTEN"], reason: "Yulaf" },
  { slug: "cilekli-yulaf-smoothie", add: ["GLUTEN"], reason: "Yulaf" },
  { slug: "firik-pilavi-gaziantep-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "nevzine-tatlisi", add: ["SUT", "SUSAM"], reason: "Tereyağı + Tahin" },
  { slug: "sac-arasi", add: ["SUT"], reason: "Tereyağı" },
  { slug: "gobete-sinop-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "empadao-de-frango", add: ["SUT"], reason: "Tereyağı" },
];

const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
];

async function main(): Promise<void> {
  assertDbTarget("fix-critical-allergens-batch11");
  console.log(
    `🔧 fix-critical-allergens-batch11 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
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
  if (!APPLY) console.log("(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
