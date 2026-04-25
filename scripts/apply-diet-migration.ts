/**
 * Oturum 20 DIET_SCORE_PLAN migration one-shot apply.
 * Dev veya prod (env override ile) tabloya 3 değişiklik eklemek için.
 * Drift nedeniyle `prisma migrate dev` koşmuyor, manuel SQL.
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

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  assertDbTarget("apply-diet-migration");

  const migrationDir = path.resolve(
    process.cwd(),
    "prisma/migrations/20260425060000_diet_scoring_base",
  );
  const sqlRaw = fs.readFileSync(path.join(migrationDir, "migration.sql"), "utf8");
  // Strip comment lines first, then split on ; (önceki filter hatalıydı)
  const sqlClean = sqlRaw
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");
  const stmts = sqlClean
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  console.log("📄 " + stmts.length + " statement uygulanacak");
  for (const s of stmts) {
    const preview = s.split("\n")[0].slice(0, 80);
    console.log("  > " + preview + (s.length > 80 ? "..." : ""));
    try {
      await prisma.$executeRawUnsafe(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Idempotent: already exists errors swallow
      if (
        msg.includes("already exists") ||
        msg.includes("column") && msg.includes("of relation") && msg.includes("already exists")
      ) {
        console.log("    ⏭️  idempotent skip: " + msg.split("\n")[0]);
        continue;
      }
      throw e;
    }
  }

  // Record in _prisma_migrations to keep history consistent
  const migrationName = "20260425060000_diet_scoring_base";
  const existing = (await prisma.$queryRaw`
    SELECT migration_name FROM _prisma_migrations WHERE migration_name = ${migrationName}
  `) as { migration_name: string }[];

  if (existing.length === 0) {
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        'manual-' || ${migrationName},
        CURRENT_TIMESTAMP,
        ${migrationName},
        CURRENT_TIMESTAMP,
        1
      )
    `;
    console.log("✅ _prisma_migrations kaydı eklendi");
  } else {
    console.log("⏭️  _prisma_migrations'da zaten kayıtlı");
  }

  console.log("🎉 Migration tamamlandı");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
