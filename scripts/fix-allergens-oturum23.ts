/**
 * Mod I + canonical rename + library kalibrasyon sonrasi top 10
 * quality dashboard analizinde tespit edilen recipe data fix'leri.
 *
 * Tek tarif (gelecekte genisletilebilir): firinda-tavuk-baget'te
 * "Tavuk baget" (tavuk parcasi) icin GLUTEN declared yanlis. Library
 * "tavuk baget" exclude ediyor; declared'dan da kaldirilmali.
 *
 * Idempotent: zaten dogru ise no-op.
 *
 * Usage:
 *   npx tsx scripts/fix-allergens-oturum23.ts                 # dry-run
 *   npx tsx scripts/fix-allergens-oturum23.ts --apply         # dev
 *   npx tsx scripts/fix-allergens-oturum23.ts --apply --confirm-prod
 */
import { PrismaClient, type Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

interface AllergenFix {
  slug: string;
  remove: Allergen[];
  add: Allergen[];
  reason: string;
}

const FIXES: AllergenFix[] = [
  {
    slug: "firinda-tavuk-baget",
    remove: ["GLUTEN"],
    add: [],
    reason: "Tavuk baget = tavuk parcasi (ekmek baget degil); ingredient list'inde glutenli kaynak yok",
  },
];

async function main() {
  assertDbTarget("fix-allergens-oturum23");
  const APPLY = process.argv.includes("--apply");

  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`DB: ${new URL(url).host}`);
  console.log("");

  let updated = 0;
  for (const f of FIXES) {
    const r = await prisma.recipe.findUnique({
      where: { slug: f.slug },
      select: { id: true, title: true, allergens: true },
    });
    if (!r) {
      console.log(`SKIP ${f.slug} (not found)`);
      continue;
    }
    const before = new Set<Allergen>(r.allergens);
    for (const a of f.remove) before.delete(a);
    for (const a of f.add) before.add(a);
    const after = [...before].sort();
    const same =
      after.length === r.allergens.length &&
      after.every((a, i) => a === [...r.allergens].sort()[i]);
    if (same) {
      console.log(`OK   ${f.slug} (already clean)`);
      continue;
    }
    console.log(`${APPLY ? "FIX " : "DRY "} ${f.slug}: [${r.allergens.join(",")}] -> [${after.join(",")}] | ${f.reason}`);
    if (!APPLY) continue;
    await prisma.recipe.update({
      where: { id: r.id },
      data: { allergens: { set: after } },
    });
    await prisma.auditLog.create({
      data: {
        action: "ALLERGEN_FIX",
        targetType: "recipe",
        targetId: r.id,
        metadata: {
          slug: f.slug,
          before: r.allergens,
          after,
          reason: f.reason,
        },
      },
    });
    updated++;
  }
  console.log("");
  console.log(`Done: ${updated} updated`);
  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
