/**
 * Tek-tarif allergen fix: tarka-dal SUT allergen ekle.
 *
 * audit-empty-allergens.ts HIGH confidence: tarka-dal tereyağı ingredient
 * içeriyor ama allergens array'inde SUT yok. Klasik Hint dal tarifinde
 * ghee/tereyağı tarka (tempering) için kullanılır, SUT allergen kapsamı
 * doğru. Tıbbi öncelik: over-flag > under-flag.
 *
 * Idempotent: SUT zaten varsa atlar. AuditLog action ALLERGEN_RETROFIT.
 *
 * Usage: npx tsx scripts/fix-tarka-dal-sut.ts (DEV)
 *        npx tsx scripts/fix-tarka-dal-sut.ts --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

const SLUG = "tarka-dal";
const ALLERGEN: Allergen = "SUT";

async function main(): Promise<void> {
  await assertDbTarget("fix-tarka-dal-sut");

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipe = await prisma.recipe.findUnique({
    where: { slug: SLUG },
    select: { id: true, slug: true, allergens: true },
  });

  if (!recipe) {
    console.error(`[fail] ${SLUG} not found in DB`);
    process.exit(1);
  }

  if (recipe.allergens.includes(ALLERGEN)) {
    console.log(`[skip] ${SLUG} zaten ${ALLERGEN} allergen barındırıyor`);
    await prisma.$disconnect();
    return;
  }

  const next = [...recipe.allergens, ALLERGEN];
  await prisma.recipe.update({
    where: { id: recipe.id },
    data: { allergens: next },
  });

  await prisma.auditLog.create({
    data: {
      action: "ALLERGEN_RETROFIT",
      targetType: "Recipe",
      targetId: recipe.id,
      metadata: {
        slug: SLUG,
        added: ALLERGEN,
        before: recipe.allergens,
        after: next,
        reason: "audit-empty-allergens HIGH: tereyağı ingredient mention, SUT eksik",
      },
    },
  });

  console.log(`[ok] ${SLUG}: +${ALLERGEN} (${recipe.allergens.length} → ${next.length})`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
