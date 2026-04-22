import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  assertDbTarget("apply-privacy-migration");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const sql = fs.readFileSync(
    "prisma/migrations/20260422180000_add_user_privacy_prefs/migration.sql",
    "utf8",
  );
  // Strip line-level "-- comment" prefix lines (block-level safe), then split.
  // Daha onceki versiyon stmt-prefix comment varsa tum stmt'i filtreliyordu.
  const cleaned = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const stmts = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of stmts) {
    console.log("Exec:", stmt.slice(0, 80) + (stmt.length > 80 ? "..." : ""));
    await prisma.$executeRawUnsafe(stmt);
  }

  // Verify
  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name::text AS column_name FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name IN ('showChefScore','showActivity','showFollowCounts')
    ORDER BY column_name
  `;
  console.log("\n✅ Verified columns:", cols.map((c) => c.column_name));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
