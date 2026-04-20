/**
 * Fix CRITICAL audit-deep findings surfaced after Codex batch 15 seed.
 *
 * Seven CRITICAL issues:
 *   6 × ALLERGEN_ACCURACY → missing allergens inferred from ingredient list
 *   1 × RECIPE_CONSISTENCY → "vegan" tag but SUT allergen set (mutually
 *       exclusive; tag is incorrect because recipe contains beyaz peynir)
 *
 * Categorical sources:
 *   Un → GLUTEN: 3 slugs (badem çorbası + nohut çorbası + semizotu çorbası)
 *   Tereyağı → SUT: 3 slugs (diyarbakır pilavı, kayısılı bulgur çorbası,
 *     findikli erişte)
 *   vegan tag → remove: 1 slug (soke bazlama, has peynir)
 *
 * Each fix is UNION-add for allergens; tag fix is a simple slug filter.
 * Source-of-truth (`seed-recipes.ts`) must get the same edit separately so
 * DB and seed don't drift on re-seed.
 *
 *   npx tsx scripts/fix-critical-allergens-batch15.ts             # dry run dev
 *   npx tsx scripts/fix-critical-allergens-batch15.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch15.ts --apply --confirm-prod
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
  { slug: "yogurtlu-semizotu-corbasi-tire-usulu", add: ["GLUTEN"], reason: "Un" },
  { slug: "reyhanli-domates-pilavi-diyarbakir-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "kuru-kayisili-bulgur-corbasi-erzurum-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "peynirli-badem-corbasi-edirne-usulu", add: ["GLUTEN"], reason: "Un" },
  { slug: "findikli-tavuklu-eriste-kocaeli-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "terbiyeli-nohut-corbasi-antalya-usulu", add: ["GLUTEN"], reason: "Un" },
];

const TAG_REMOVALS: readonly {
  slug: string;
  removeTags: string[];
  reason: string;
}[] = [
  {
    slug: "eksi-maya-zeytinli-bazlama-soke-usulu",
    removeTags: ["vegan"],
    reason: "Beyaz peynir içeriyor → vegan olamaz (SUT allergen'i zaten var)",
  },
  {
    slug: "reyhanli-domates-pilavi-diyarbakir-usulu",
    removeTags: ["vegan"],
    reason: "Tereyağı içeriyor → vegan olamaz (SUT allergen'i şimdi eklendi)",
  },
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
  assertDbTarget("fix-critical-allergens-batch15");
  console.log(
    `🔧 fix-critical-allergens-batch15 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  // ── Allergen fixes (UNION add) ─────────────────────────────────────
  const allergenRecipes = await prisma.recipe.findMany({
    where: { slug: { in: ALLERGEN_FIXES.map((f) => f.slug) } },
    select: { id: true, slug: true, allergens: true },
  });

  let allergenUpdated = 0;
  let allergenAlreadyClean = 0;
  console.log("── Allergen fixes ──");
  for (const fix of ALLERGEN_FIXES) {
    const recipe = allergenRecipes.find((r) => r.slug === fix.slug);
    if (!recipe) {
      console.error(`❌ Slug not in DB: ${fix.slug}`);
      continue;
    }
    const current = new Set<Allergen>(recipe.allergens as Allergen[]);
    const before = ALLERGEN_ORDER.filter((a) => current.has(a));
    for (const a of fix.add) current.add(a);
    const after = ALLERGEN_ORDER.filter((a) => current.has(a));

    if (after.length === before.length) {
      allergenAlreadyClean++;
      continue;
    }
    allergenUpdated++;
    console.log(
      `  ${recipe.slug.padEnd(50)} [${before.join(",") || "∅"}] → [${after.join(",")}]  (${fix.reason})`,
    );
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { allergens: after },
      });
    }
  }

  // ── Tag fixes (remove stale tag) ───────────────────────────────────
  console.log("\n── Tag fixes ──");
  let tagUpdated = 0;
  let tagAlreadyClean = 0;
  for (const fix of TAG_REMOVALS) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: {
        id: true,
        slug: true,
        tags: { select: { tag: { select: { id: true, slug: true } } } },
      },
    });
    if (!recipe) {
      console.error(`❌ Slug not in DB: ${fix.slug}`);
      continue;
    }
    const tagsToRemove = recipe.tags.filter((rt) =>
      fix.removeTags.includes(rt.tag.slug),
    );
    if (tagsToRemove.length === 0) {
      tagAlreadyClean++;
      continue;
    }
    tagUpdated++;
    console.log(
      `  ${recipe.slug.padEnd(50)} remove tags=[${tagsToRemove.map((t) => t.tag.slug).join(",")}]  (${fix.reason})`,
    );
    if (APPLY) {
      await prisma.recipeTag.deleteMany({
        where: {
          recipeId: recipe.id,
          tagId: { in: tagsToRemove.map((t) => t.tag.id) },
        },
      });
    }
  }

  const verb = APPLY ? "Updated" : "Would update";
  console.log(
    `\n${verb}: ${allergenUpdated + tagUpdated} changes (allergen=${allergenUpdated}, tag=${tagUpdated}) | Already clean: ${allergenAlreadyClean + tagAlreadyClean}`,
  );
  if (!APPLY) console.log("(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
