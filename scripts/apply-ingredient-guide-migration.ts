/**
 * IngredientGuide tablosu manuel migration (Mod H Faz 0).
 * Prisma migrate eski migration'larla cakistigi icin sadece bu yeni
 * tabloyu raw SQL ile uygular. Idempotent (CREATE IF NOT EXISTS yok
 * ama duplicate hatasi catch edilir).
 *
 * Kullanim:
 *   npx tsx scripts/apply-ingredient-guide-migration.ts                  # dev
 *   DATABASE_URL=<prod> npx tsx scripts/apply-ingredient-guide-migration.ts --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  assertDbTarget("apply-ingredient-guide-migration");

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ingredient_guides" (
        "id" TEXT NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "whyUsed" VARCHAR(500) NOT NULL,
        "substitutes" JSONB NOT NULL,
        "notes" VARCHAR(500),
        "source" VARCHAR(100),
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ingredient_guides_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ingredient_guides_name_key" ON "ingredient_guides"("name");
    `);
    console.log("✅ ingredient_guides tablosu hazir");
  } catch (e) {
    console.error("❌ Migration FAIL:", e);
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
