/**
 * Tek-tarif allergen fix: napoli-pasta-alla-genovese KEREVIZ allergen ekle.
 *
 * audit-recipe-quality.ts GATE B (oturum 33 rafine) bu tarif için kereviz
 * mention buldu ama allergen array'inde KEREVIZ yoktu. Klasik Napolitan
 * Pasta alla Genovese soğanlı kuzu ragu'su, içinde sebze tabanı olarak
 * kereviz sapı bulunur (carrot/celery/onion = soffritto). Tıbbi öncelik:
 * over-flag > under-flag.
 *
 * Idempotent: KEREVIZ zaten varsa atlar. AuditLog action ALLERGEN_RETROFIT.
 *
 * Genel fix-allergen-mismatch.ts kullanılmadı çünkü oturum 33 öncesi
 * keyword listesi rafine değil, false positive'ler ekleyebilir
 * (mumbai/bitlis-gilorik/kocaeli-pismaniye gibi).
 *
 * Usage: npx tsx scripts/fix-napoli-genovese-kereviz.ts (DEV)
 *        npx tsx scripts/fix-napoli-genovese-kereviz.ts --confirm-prod
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

const SLUG = "napoli-pasta-alla-genovese";
const ALLERGEN: Allergen = "KEREVIZ";

async function main(): Promise<void> {
  await assertDbTarget("fix-napoli-genovese-kereviz");

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
        reason: "GATE B audit: kereviz mention in step text (soffritto), allergen array missing",
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
