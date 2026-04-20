/**
 * Fix the 26 CRITICAL allergen gaps surfaced by scripts/audit-deep.ts.
 *
 * Each recipe already has a non-empty `allergens` array, which causes
 * retrofit-allergens.ts (existing-array → skip) to miss them. The deep
 * audit has richer keyword coverage than src/lib/allergens.ts (e.g.
 * plain "nişasta" → GLUTEN), so the 26 slugs below need the missing
 * allergen UNION-added without touching their existing tags.
 *
 * Idempotent: each fix is a set union, so re-running is a no-op after
 * the first successful apply. Prints a preview and exits early in dry
 * run mode (the default).
 *
 *   npx tsx scripts/fix-critical-allergens.ts              # dry run
 *   npx tsx scripts/fix-critical-allergens.ts --apply      # write
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

/** Surgical fixes keyed by slug. Every entry traces to an audit-deep CRITICAL. */
const FIXES: readonly { slug: string; add: Allergen[]; reason: string }[] = [
  // GLUTEN, plain "Nişasta" or wheat-derived ingredient missed by inference
  { slug: "sutlac", add: ["GLUTEN"], reason: "Nişasta" },
  { slug: "sicak-cikolata", add: ["GLUTEN"], reason: "Nişasta" },
  { slug: "tavuk-gogsu", add: ["GLUTEN"], reason: "Nişasta" },
  { slug: "muhallebi", add: ["GLUTEN"], reason: "Nişasta + Un" },
  { slug: "pavlova", add: ["GLUTEN"], reason: "Nişasta" },
  { slug: "jalapeno-poppers", add: ["GLUTEN"], reason: "Galeta unu" },
  { slug: "patates-rosti-lokmalari", add: ["GLUTEN"], reason: "Un" },
  { slug: "taze-fasulyeli-bulgur-pilavi", add: ["GLUTEN"], reason: "Pilavlık bulgur" },
  { slug: "blabarssoppa", add: ["GLUTEN"], reason: "Nişasta" },
  { slug: "nyponsoppa", add: ["GLUTEN"], reason: "Nişasta" },
  { slug: "har-gow", add: ["GLUTEN"], reason: "Buğday nişastası" },

  // SUT, Tereyağı or dairy derivative missed by inference
  { slug: "empanada", add: ["SUT"], reason: "Tereyağı" },
  { slug: "sucuklu-menemen", add: ["SUT"], reason: "Tereyağı" },
  { slug: "pastirmali-yumurta", add: ["SUT"], reason: "Tereyağı" },
  { slug: "kavurmali-yumurta", add: ["SUT"], reason: "Tereyağı" },
  { slug: "arpa-sehriyeli-nohut-pilavi", add: ["SUT"], reason: "Tereyağı" },
  { slug: "katsu-sando", add: ["SUT"], reason: "Japon süt ekmeği" },
  { slug: "kaak-bi-simsim", add: ["SUT"], reason: "Tereyağı" },
  { slug: "sellou", add: ["SUT"], reason: "Tereyağı" },
  { slug: "quindim", add: ["SUT"], reason: "Tereyağı" },
  { slug: "firik-pilavi", add: ["SUT"], reason: "Tereyağı" },

  // SUSAM, Susam yağı / susam / tahin missed by inference
  { slug: "tavuklu-noodle", add: ["SUSAM"], reason: "Susam yağı" },
  { slug: "sosisli-milfoy-cubuklari", add: ["SUSAM"], reason: "Susam" },
  { slug: "cong-you-bing", add: ["SUSAM"], reason: "Susam yağı" },
  { slug: "hurmali-muzlu-smoothie", add: ["SUSAM"], reason: "Tahin" },
  { slug: "scallion-pancake", add: ["SUSAM"], reason: "Susam yağı" },
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

function canonicalOrder(set: Set<Allergen>): Allergen[] {
  return ALLERGEN_ORDER.filter((a) => set.has(a));
}

async function main(): Promise<void> {
  assertDbTarget("fix-critical-allergens");
  console.log(
    `🔧 fix-critical-allergens (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const slugs = FIXES.map((f) => f.slug);
  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, title: true, allergens: true },
  });

  const missing = slugs.filter((s) => !recipes.find((r) => r.slug === s));
  if (missing.length > 0) {
    console.error(`❌ Missing slugs in DB: ${missing.join(", ")}`);
    process.exit(1);
  }

  let willWrite = 0;
  let alreadyClean = 0;

  for (const fix of FIXES) {
    const recipe = recipes.find((r) => r.slug === fix.slug)!;
    const current = new Set<Allergen>(recipe.allergens as Allergen[]);
    const before = canonicalOrder(current);
    for (const a of fix.add) current.add(a);
    const after = canonicalOrder(current);

    const changed = after.length !== before.length;
    if (!changed) {
      alreadyClean++;
      continue;
    }
    willWrite++;

    console.log(
      `  ${recipe.slug.padEnd(32)} [${before.join(",") || "∅"}] → [${after.join(",")}]  (${fix.reason})`,
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
    `\n${verb}: ${willWrite} | Already clean (idempotent): ${alreadyClean} | Total: ${FIXES.length}`,
  );
  if (!APPLY) console.log("(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
