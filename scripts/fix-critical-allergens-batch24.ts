/**
 * Batch 24 CRITICAL allergen fix (idempotent).
 *
 * Audit: 1 gerçek eksiklik tespit edildi, 6 false positive (hindistancevizi
 * + karabuğday + arpacık soğan, hepsi Brief §5/§9 istisnası).
 *
 *   - dereotlu-somon-patates-tava-isvec-usulu: Tereyağı var, SUT yok → SUT ekle.
 *
 * Source patch zaten seed-recipes.ts'te uygulandı; bu script dev ve prod
 * DB'de kalan mevcut tarifleri de idempotent günceller (batch 24 seed
 * sonrası bu tarife SUT zaten eklenmiş olacak, "already clean" logu).
 *
 * Usage:
 *   npx tsx scripts/fix-critical-allergens-batch24.ts --apply
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch24.ts --apply --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
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

interface FixPlan {
  slug: string;
  addAllergens: Allergen[];
  note: string;
}

const fixes: FixPlan[] = [
  {
    slug: "dereotlu-somon-patates-tava-isvec-usulu",
    addAllergens: ["SUT"],
    note: "Tereyağı ingredient, SUT eksik",
  },
];

async function main(): Promise<void> {
  if (APPLY) assertDbTarget("fix-critical-allergens-batch24");

  console.log(`🔧 batch 24 CRITICAL allergen fix, ${fixes.length} adet\n`);

  let updated = 0;
  let alreadyClean = 0;
  let notFound = 0;

  for (const f of fixes) {
    const r = await prisma.recipe.findUnique({
      where: { slug: f.slug },
      select: { id: true, title: true, allergens: true },
    });
    if (!r) {
      console.log(`  ⚠️  ${f.slug} DB'de yok (muhtemelen seed henüz koşulmadı)`);
      notFound++;
      continue;
    }
    const existing = new Set(r.allergens);
    const toAdd = f.addAllergens.filter((a) => !existing.has(a));
    if (toAdd.length === 0) {
      console.log(`  ✅ ${f.slug} zaten temiz (${f.note})`);
      alreadyClean++;
      continue;
    }
    const next = [...r.allergens, ...toAdd];
    console.log(
      `  🔧 ${f.slug}: +${toAdd.join(",")}  (${f.note})`,
    );
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { allergens: next },
      });
      updated++;
    }
  }

  console.log(
    `\n📊 özet, updated=${updated}, alreadyClean=${alreadyClean}, notFound=${notFound} (apply=${APPLY})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
