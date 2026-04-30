/**
 * ROLLBACK: tarka-dal SUT allergen kaldır.
 *
 * Önceki fix-tarka-dal-sut.ts yanlış uygulandı: tarif source'ta
 * "Tereyağı yerine sıvı yağ" ingredient kullanıyor, yani tereyağı
 * KULLANMIYOR (vegan tag). audit-empty-allergens "tereyağı yerine"
 * exclude pattern'ine sahip değil, false positive.
 *
 * Bu script SUT allergen'i geri alır + AuditLog action ALLERGEN_ROLLBACK.
 *
 * Usage: npx tsx scripts/rollback-tarka-dal-sut.ts (DEV)
 *        npx tsx scripts/rollback-tarka-dal-sut.ts --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
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

async function main(): Promise<void> {
  await assertDbTarget("rollback-tarka-dal-sut");

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipe = await prisma.recipe.findUnique({
    where: { slug: "tarka-dal" },
    select: { id: true, slug: true, allergens: true },
  });

  if (!recipe) {
    console.error("[fail] tarka-dal not found");
    process.exit(1);
  }

  if (!recipe.allergens.includes("SUT")) {
    console.log("[skip] tarka-dal SUT zaten yok");
    await prisma.$disconnect();
    return;
  }

  const next = recipe.allergens.filter((a) => a !== "SUT");
  await prisma.recipe.update({
    where: { id: recipe.id },
    data: { allergens: next },
  });

  await prisma.auditLog.create({
    data: {
      action: "ALLERGEN_ROLLBACK",
      targetType: "Recipe",
      targetId: recipe.id,
      metadata: {
        slug: "tarka-dal",
        removed: "SUT",
        before: recipe.allergens,
        after: next,
        reason: "Önceki fix yanlış: tarif 'tereyağı yerine sıvı yağ' kullanıyor (vegan), SUT false positive",
      },
    },
  });

  console.log(`[ok] tarka-dal: -SUT (${recipe.allergens.length} → ${next.length})`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
