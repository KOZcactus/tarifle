/**
 * Destructive migration detector.
 *
 * Vercel build pipeline'ında `prisma migrate deploy`'dan ÖNCE koşar. Tüm
 * migration SQL dosyalarını tarar, aşağıdaki "geri alınamaz" pattern'ları
 * bulursa stderr + exit 1 ile build'i durdurur.
 *
 *   - DROP TABLE
 *   - DROP COLUMN
 *   - DROP INDEX (destructive değil ama uyarılık)
 *   - ALTER COLUMN ... TYPE (type change data loss riski)
 *   - TRUNCATE
 *
 * Bypass: Kasıtlı bir destructive migration yapıyorsan (ör. geçici bir
 * column sil), env var `ALLOW_DESTRUCTIVE_MIGRATION=1` ile koş. Hem local
 * hem Vercel Production env'ine tek seferlik eklenir, commit'e girmez.
 *
 * Kapsam: yalnız PENDING migration'lar (prod'a henüz uygulanmamış).
 * Applied olmuş eski migration'lar tarama dışı — ya zaten geçmişte
 * uygulanmış ya bilerek kabul edilmiş.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;

const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const MIGRATIONS_DIR = path.resolve(__d, "..", "prisma", "migrations");

interface DestructivePattern {
  /** Regex pattern — multiline, case-insensitive. */
  pattern: RegExp;
  /** Human label for the warning. */
  label: string;
  /** severity: "error" blocks build, "warn" logs only. */
  severity: "error" | "warn";
}

const PATTERNS: readonly DestructivePattern[] = [
  { pattern: /\bDROP\s+TABLE\b/i, label: "DROP TABLE", severity: "error" },
  { pattern: /\bDROP\s+COLUMN\b/i, label: "DROP COLUMN", severity: "error" },
  { pattern: /\bTRUNCATE\s+TABLE\b/i, label: "TRUNCATE TABLE", severity: "error" },
  {
    pattern: /\bALTER\s+(TABLE|COLUMN)\s+\S+\s+(ALTER|DROP|TYPE)/i,
    label: "ALTER TABLE / COLUMN (potential type change)",
    severity: "warn",
  },
  { pattern: /\bDROP\s+INDEX\b/i, label: "DROP INDEX", severity: "warn" },
  { pattern: /\bDROP\s+ENUM\b|DROP\s+TYPE\b/i, label: "DROP TYPE/ENUM", severity: "error" },
  { pattern: /\bDELETE\s+FROM\s+\S+\s*;?\s*$/im, label: "DELETE FROM (full table)", severity: "error" },
];

interface Finding {
  migration: string;
  line: number;
  matched: string;
  label: string;
  severity: "error" | "warn";
}

async function getAppliedMigrationNames(): Promise<Set<string>> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[destructive-check] DATABASE_URL missing — skipping DB check, scanning ALL migrations.");
    return new Set();
  }

  try {
    const adapter = new PrismaNeon({ connectionString: url });
    const prisma = new PrismaClient({ adapter });
    const rows = await prisma.$queryRaw<
      { migration_name: string }[]
    >`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    await prisma.$disconnect();
    return new Set(rows.map((r) => r.migration_name));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Migration table yoksa (fresh DB) veya placeholder DB'ye bağlandıysak
    // sessizce tüm migration'ları pending say. Build pipeline'ı bozmaz.
    console.warn(`[destructive-check] DB probe failed (${msg.slice(0, 80)}), scanning ALL migrations.`);
    return new Set();
  }
}

async function main(): Promise<void> {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log("[destructive-check] No migrations directory — skipping.");
    return;
  }

  const allowOverride = process.env.ALLOW_DESTRUCTIVE_MIGRATION === "1";
  const applied = await getAppliedMigrationNames();

  const migrations = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !applied.has(name)) // yalnız pending
    .sort();

  if (migrations.length === 0) {
    console.log("[destructive-check] No pending migrations.");
    return;
  }

  const findings: Finding[] = [];

  for (const name of migrations) {
    const sqlPath = join(MIGRATIONS_DIR, name, "migration.sql");
    if (!existsSync(sqlPath)) continue;
    const sql = readFileSync(sqlPath, "utf8");
    const lines = sql.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Comment line → skip
      if (/^\s*--/.test(line)) continue;
      for (const p of PATTERNS) {
        const m = line.match(p.pattern);
        if (m) {
          findings.push({
            migration: name,
            line: i + 1,
            matched: line.trim().slice(0, 120),
            label: p.label,
            severity: p.severity,
          });
        }
      }
    }
  }

  if (findings.length === 0) {
    console.log(
      `✅ [destructive-check] ${migrations.length} pending migration, no destructive pattern.`,
    );
    return;
  }

  console.error("\n⚠️  Destructive migration detector findings:\n");
  for (const f of findings) {
    const icon = f.severity === "error" ? "❌" : "⚠️";
    console.error(
      `  ${icon} ${f.migration}:${f.line}  [${f.label}]\n     ${f.matched}`,
    );
  }

  const errors = findings.filter((f) => f.severity === "error");
  if (errors.length > 0 && !allowOverride) {
    console.error(
      `\n💥 ${errors.length} destructive statement blocks the build.\n` +
        `   Override: ALLOW_DESTRUCTIVE_MIGRATION=1 npm run build\n` +
        `   (bilerek yapıyorsan Vercel Production env'e geçici olarak ekle,\n` +
        `    deploy bittikten sonra kaldır.)`,
    );
    process.exit(1);
  }

  if (allowOverride) {
    console.warn(
      `\n⚠️  ALLOW_DESTRUCTIVE_MIGRATION=1 set — build devam ediyor. Bu tek seferlik deploy için olmalı.`,
    );
  }
}

main().catch((err) => {
  console.error("[destructive-check] crashed:", err);
  process.exit(1);
});
