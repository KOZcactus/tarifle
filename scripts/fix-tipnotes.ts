/**
 * One-shot tipNote cleanup. Two dessert tarifinde eski tipNote "ya da
 * tersi" ile muğlak kaldı; iki case ayrı ayrı net yazıldı.
 *
 *   npx tsx scripts/fix-tipnotes.ts
 *
 * Idempotent: hedef cümle zaten DB'deyse dokunmaz.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FIXES = [
  {
    slug: "baklava",
    tipNote:
      "Baklava fırından yeni çıkmışsa üzerine soğuk şerbet dök. Baklava soğumuşsa sıcak şerbet kullan. İkisi birden sıcak olursa şerbet emmez.",
  },
  {
    slug: "revani",
    tipNote:
      "Kek sıcakken soğuk şerbet dök. Kek soğumuşsa sıcak şerbet kullan. İkisi birden sıcak olursa kek hamur gibi kalır.",
  },
];

async function main() {
  assertDbTarget("fix-tipnotes");
  let updated = 0;
  let skipped = 0;
  for (const f of FIXES) {
    const r = await prisma.recipe.findUnique({
      where: { slug: f.slug },
      select: { id: true, tipNote: true },
    });
    if (!r) {
      console.warn(`  ⚠ ${f.slug}: bulunamadı`);
      continue;
    }
    if (r.tipNote === f.tipNote) {
      console.log(`  ✓ ${f.slug}: zaten güncel`);
      skipped++;
      continue;
    }
    await prisma.recipe.update({
      where: { id: r.id },
      data: { tipNote: f.tipNote },
    });
    console.log(`  ✏  ${f.slug}: tipNote güncellendi`);
    updated++;
  }
  console.log(`\n✅ ${updated} güncellendi, ${skipped} zaten temiz.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
