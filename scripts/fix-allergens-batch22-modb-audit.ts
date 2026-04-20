/**
 * Batch 22 Mod B import sonrası audit'inde yakalanan 2 allergen düzeltmesi.
 * Codex Mod B JSON'unda `issues` array'i bu bulguları flag'ledi:
 *
 *   1. menengicli-irmik-muhallebisi-gaziantep-usulu
 *      Ingredients: İrmik | Süt | Şeker | Menengiç ezmesi
 *      Mevcut:  [GLUTEN, SUT]
 *      Doğru:   [GLUTEN, SUT, KUSUYEMIS]
 *      Sebep: Menengiç (Pistacia terebinthus) tree-nut familyası,
 *             cross-reactivity riski, KUSUYEMIS grubuna ait.
 *
 *   2. poha-peanut-hint-kahvalti-usulu
 *      Ingredients: Poha | Yer fıstığı | Soğan | Zerdeçal | Limon suyu
 *      Mevcut:  [KUSUYEMIS, YER_FISTIGI]
 *      Doğru:   [YER_FISTIGI]
 *      Sebep: Tree-nut ingredient YOK (ceviz/fındık/badem/kestane
 *             geçmiyor); yer fıstığı YER_FISTIGI'ne ait, KUSUYEMIS
 *             yanlış atanmış.
 *
 *   npx tsx scripts/fix-allergens-batch22-modb-audit.ts             # dry run
 *   npx tsx scripts/fix-allergens-batch22-modb-audit.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-allergens-batch22-modb-audit.ts --apply --confirm-prod
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

interface AllergenFix {
  slug: string;
  add: Allergen[];
  remove: Allergen[];
  reason: string;
}

const FIXES: readonly AllergenFix[] = [
  {
    slug: "menengicli-irmik-muhallebisi-gaziantep-usulu",
    add: ["KUSUYEMIS"],
    remove: [],
    reason: "Menengiç ezmesi (Pistacia terebinthus) tree-nut grubuna ait",
  },
  {
    slug: "poha-peanut-hint-kahvalti-usulu",
    add: [],
    remove: ["KUSUYEMIS"],
    reason: "Tree-nut ingredient yok; sadece yer fıstığı var (YER_FISTIGI)",
  },
] as const;

async function main() {
  assertDbTarget("fix-allergens-batch22-modb-audit");

  console.log(`\n🔎 Planned fixes: ${FIXES.length}`);
  let applied = 0;
  let skipped = 0;

  for (const fix of FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, slug: true, allergens: true, title: true },
    });

    if (!recipe) {
      console.log(`  ❌ ${fix.slug}, bulunamadı, atla`);
      skipped++;
      continue;
    }

    const current = new Set(recipe.allergens);
    for (const a of fix.add) current.add(a);
    for (const a of fix.remove) current.delete(a);
    const next = [...current].sort() as Allergen[];

    const prev = [...recipe.allergens].sort().join(",");
    const nextJoined = next.join(",");
    if (prev === nextJoined) {
      console.log(`  ⏭️  ${fix.slug}, değişiklik yok (zaten ${prev})`);
      skipped++;
      continue;
    }

    console.log(`  📝 ${fix.slug}`);
    console.log(`     ${recipe.title}`);
    console.log(`     ${prev || "(boş)"} → ${nextJoined || "(boş)"}`);
    console.log(`     sebep: ${fix.reason}`);

    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { allergens: { set: next } },
      });
      applied++;
    }
  }

  console.log(`\n${APPLY ? "✅" : "🧪"} ${APPLY ? "applied" : "dry-run"}: ${applied}, skipped: ${skipped}`);
  if (!APPLY) console.log("   (re-run with --apply to write)");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
