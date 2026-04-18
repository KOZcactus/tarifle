/**
 * Fix CRITICAL allergen gaps surfaced by audit-deep after Codex batch 12 seed.
 * Sixteen slugs had ingredients that implied allergens not declared in their
 * `allergens` array. Two additional flags (Kekik → GLUTEN, on Sürk Ezmesi +
 * Kekikli Omlet) were false positives from the "kek" substring hitting "kekik"
 * (thyme); those are fixed in audit-deep.ts excludePatterns instead.
 *
 * Categorical sources of missing allergens in this batch:
 *   Tereyağı → SUT: 8 slugs
 *   İrmik → GLUTEN: 3 slugs
 *   Nişasta (wheat-starch, traditional) → GLUTEN: 2 slugs
 *   Susam / Ayran / Yumurta / Ceviz: 1 each
 *
 * Each fix is UNION-add: existing allergens stay, missing ones get appended in
 * canonical order. Source-of-truth (`seed-recipes.ts`) gets the same fix in a
 * separate edit so DB and seed file don't drift.
 *
 *   npx tsx scripts/fix-critical-allergens-batch12.ts          # dry run
 *   npx tsx scripts/fix-critical-allergens-batch12.ts --apply  # write
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
  { slug: "eriste-corbasi-kastamonu-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "yumurtali-ispanak-kavurmasi-karadeniz-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "biberli-ekmek-hatay-usulu", add: ["SUSAM"], reason: "Susam (seed topping)" },
  { slug: "acik-agiz-boregi-kayseri-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "tandir-boregi-kars-usulu", add: ["YUMURTA"], reason: "Yumurta" },
  { slug: "harire-tatlisi-mardin-usulu", add: ["GLUTEN"], reason: "Nişasta (traditionally wheat starch)" },
  { slug: "irmik-helvasi-maras-dondurmali", add: ["GLUTEN"], reason: "İrmik (semolina = wheat)" },
  { slug: "kabak-bastisi-gaziantep-usulu", add: ["GLUTEN"], reason: "İrmik" },
  { slug: "girit-ezmesi-izmir-usulu", add: ["KUSUYEMIS"], reason: "Ceviz" },
  { slug: "karalahana-corbasi-ordu-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "yuksuk-corbasi-adana-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "hamsili-pilav-artvin-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "sembusek-mardin-usulu", add: ["SUT"], reason: "Ayran" },
  { slug: "hosmerim-balikesir-usulu", add: ["GLUTEN"], reason: "İrmik" },
  { slug: "nevzine-kayseri-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "paluze-kilis-usulu", add: ["GLUTEN"], reason: "Nişasta (traditionally wheat starch)" },
];

const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
];

async function main(): Promise<void> {
  assertDbTarget("fix-critical-allergens-batch12");
  console.log(
    `🔧 fix-critical-allergens-batch12 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
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
      `  ${recipe.slug.padEnd(48)} [${before.join(",") || "∅"}] → [${after.join(",")}]  (${fix.reason})`,
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
