/**
 * RecipeNutrition migration apply (oturum 20 Faz 2).
 * Idempotent, dev + prod uygular.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  assertDbTarget("apply-recipe-nutrition-migration");
  const sqlPath = path.resolve(
    process.cwd(),
    "prisma/migrations/20260425170000_recipe_nutrition/migration.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf8");
  const stmts = sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  console.log("📄 " + stmts.length + " statement");
  for (const s of stmts) {
    console.log("  > " + s.split("\n")[0].slice(0, 70));
    try {
      await prisma.$executeRawUnsafe(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log("    skip (exists)");
        continue;
      }
      throw e;
    }
  }

  const name = "20260425170000_recipe_nutrition";
  const exists = (await prisma.$queryRaw`
    SELECT migration_name FROM _prisma_migrations WHERE migration_name = ${name}
  `) as { migration_name: string }[];
  if (exists.length === 0) {
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
      VALUES (gen_random_uuid()::text, ${"manual-" + name}, CURRENT_TIMESTAMP, ${name}, CURRENT_TIMESTAMP, 1)
    `;
    console.log("✅ history kaydı eklendi");
  }
  console.log("🎉 done");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
