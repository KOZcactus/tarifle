/**
 * Fix CRITICAL allergen findings for Codex batch 18 seed.
 *
 * Two ingredient-allergen mismatches caught by the inline batch 18 audit
 * (scripts/audit-batch18-inline.ts):
 *
 *   Irmik (semolina) → GLUTEN: 1 slug (Rus tvorog zapekanka tatlısı)
 *   Tereyağı       → SUT:    1 slug (Kırklareli tavuklu kalle)
 *
 * A third keyword hit on "karabuğday" (buckwheat) was a false positive,
 * buckwheat is gluten-free, so Codex's empty allergen list on Grechka
 * Mantar Köftesi is correct.
 *
 *   npx tsx scripts/fix-critical-allergens-batch18.ts             # dry run
 *   npx tsx scripts/fix-critical-allergens-batch18.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch18.ts --apply --confirm-prod
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
  { slug: "tvorog-zapekanka-rus-usulu", add: ["GLUTEN"], reason: "İrmik (semolina)" },
  { slug: "tavuklu-kalle-kirklareli-usulu", add: ["SUT"], reason: "Tereyağı" },
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
  assertDbTarget("fix-critical-allergens-batch18");
  console.log(
    `🔧 fix-critical-allergens-batch18 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: ALLERGEN_FIXES.map((f) => f.slug) } },
    select: { id: true, slug: true, allergens: true },
  });

  let updated = 0;
  let alreadyClean = 0;
  let missing = 0;

  for (const fix of ALLERGEN_FIXES) {
    const recipe = recipes.find((r) => r.slug === fix.slug);
    if (!recipe) {
      console.log(`  ⚠ ${fix.slug}, DB'de yok (atlandı)`);
      missing++;
      continue;
    }

    const current = new Set<Allergen>(recipe.allergens as Allergen[]);
    const toAdd = fix.add.filter((a) => !current.has(a));

    if (toAdd.length === 0) {
      console.log(`  ⏭  ${fix.slug}, zaten temiz (${[...current].join(", ") || "none"})`);
      alreadyClean++;
      continue;
    }

    for (const a of toAdd) current.add(a);
    const sorted = ALLERGEN_ORDER.filter((a) => current.has(a));

    console.log(
      `  ${APPLY ? "✅" : "🔍"} ${fix.slug}, +${toAdd.join(", ")} (${fix.reason}) → [${sorted.join(", ")}]`,
    );

    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { allergens: sorted },
      });
      updated++;
    }
  }

  console.log(
    `\nÖzet: ${APPLY ? `${updated} güncellendi` : "dry-run"}, ${alreadyClean} zaten temiz, ${missing} DB'de yok.`,
  );
}

main()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
