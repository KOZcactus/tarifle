/**
 * Fix CRITICAL allergen findings for Codex batch 19 seed.
 *
 * Five ingredient-allergen mismatches caught by audit-batch18-inline.ts
 * (run as `--last 100 --label "batch 19"`):
 *
 *   Tereyağı → SUT: 4 slug (Trabzon mısır ekmeği dürümü, Uşak tarhanalı
 *     mercimek çorbası, Seffa, Kedgeree)
 *   Ceviz    → KUSUYEMIS: 1 slug (Elazığ dut pekmezli bulgur tatlısı)
 *
 * A sixth keyword hit on "karabuğday" (buckwheat, Kasha Grechnevaya) was a
 * false positive, buckwheat is gluten-free, so Codex's SUT-only allergen
 * on that recipe is correct.
 *
 *   npx tsx scripts/fix-critical-allergens-batch19.ts             # dry run
 *   npx tsx scripts/fix-critical-allergens-batch19.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch19.ts --apply --confirm-prod
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
  { slug: "fasulyeli-misir-ekmegi-durumu-trabzon-yayla-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "tarhanali-mercimek-corbasi-usak-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "seffa-kuzey-afrika-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "kedgeree-ingiliz-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "dut-pekmezli-bulgur-tatlisi-elazig-usulu", add: ["KUSUYEMIS"], reason: "Ceviz" },
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
  assertDbTarget("fix-critical-allergens-batch19");
  console.log(
    `🔧 fix-critical-allergens-batch19 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
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
