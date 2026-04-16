/**
 * Fix 3 CRITICAL allergen gaps surfaced by the expanded audit-deep.ts:
 * recipes with mayonez ingredients missing the YUMURTA allergen.
 *
 * Idempotent UNION-merge on the allergens array. Re-running is a no-op.
 *
 *   npx tsx scripts/fix-mayonez-yumurta.ts              # dry run
 *   npx tsx scripts/fix-mayonez-yumurta.ts --apply      # write
 */
import { PrismaClient, type Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

const FIXES: readonly { slug: string; add: Allergen[]; reason: string }[] = [
  { slug: "atom-sos", add: ["YUMURTA"], reason: "Mayonez" },
  { slug: "waldorf-salatasi", add: ["YUMURTA"], reason: "Mayonez" },
  { slug: "esquites-con-queso", add: ["YUMURTA"], reason: "Mayonez" },
];

const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
];

async function main(): Promise<void> {
  console.log(
    `🔧 fix-mayonez-yumurta (${APPLY ? "APPLY" : "DRY RUN"}) → ${
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
      `  ${recipe.slug.padEnd(28)} [${before.join(",") || "∅"}] → [${after.join(",")}]  (${fix.reason})`,
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
