/**
 * GATE A 792 hit toplu fix paketi (oturum 32):
 * audit-recipe-quality.ts GATE A rafine algoritma 792 totalMinutes
 * tutarsızlığı yakaladı. Marine süresi (>=30dk timerSeconds) total'a
 * yanlış girmiş veya hiç eklenmemiş tarifler.
 *
 * Fix: totalMinutes = prepMinutes + cookMinutes + waitMinutes (canonical
 * formül). DB + source eş güncelleme. AuditLog GATE_A_TIME_FIX kayıt.
 *
 * Güvenlik: %10 tolerans + 10dk minimum sapma altı olanları fix etmiyor
 * (false positive önleme). Ekstrem sapma (>%200) anomalili tariflere
 * uyarı, manuel kontrol için listede tutuyor.
 *
 * Usage:
 *   npx tsx scripts/fix-gate-a-totalminutes.ts        (dry-run, dev)
 *   npx tsx scripts/fix-gate-a-totalminutes.ts --apply
 *   npx tsx scripts/fix-gate-a-totalminutes.ts --apply --confirm-prod (prod)
 */
import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { assertDbTarget } from "./lib/db-env";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local") });

const APPLY = process.argv.includes("--apply");
const SOURCE_PATH = path.resolve("scripts/seed-recipes.ts");
const WAIT_THRESHOLD_SEC = 1800; // 30 dakika

interface HitRow {
  id: string;
  slug: string;
  totalMinutes: number;
  prepMinutes: number;
  cookMinutes: number;
  waitMinutes: number;
  expected: number;
  diff: number;
  diffRatio: number;
}

async function main() {
  const target = assertDbTarget("fix-gate-a-totalminutes");
  console.log(`💾 DB: ${target.host}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, slug: true,
      totalMinutes: true, prepMinutes: true, cookMinutes: true,
      steps: { select: { timerSeconds: true } },
    },
  });

  const hits: HitRow[] = [];
  for (const r of recipes) {
    if (!r.totalMinutes) continue;
    const prepMin = r.prepMinutes ?? 0;
    const cookMin = r.cookMinutes ?? 0;
    if (prepMin === 0 && cookMin === 0) continue;
    let waitMinutes = 0;
    for (const s of r.steps) {
      if (!s.timerSeconds) continue;
      if (s.timerSeconds >= WAIT_THRESHOLD_SEC) waitMinutes += s.timerSeconds / 60;
    }
    const expected = Math.round(prepMin + cookMin + waitMinutes);
    const diff = Math.abs(r.totalMinutes - expected);
    const diffRatio = expected > 0 ? diff / expected : 0;
    if (diffRatio > 0.1 && diff > 10) {
      hits.push({
        id: r.id, slug: r.slug,
        totalMinutes: r.totalMinutes, prepMinutes: prepMin, cookMinutes: cookMin,
        waitMinutes: Math.round(waitMinutes), expected, diff: Math.round(diff), diffRatio,
      });
    }
  }
  console.log(`Hits: ${hits.length}`);

  // Kategori: küçük sapma vs ekstrem
  const moderate = hits.filter((h) => h.diffRatio <= 2.0);
  const extreme = hits.filter((h) => h.diffRatio > 2.0);
  console.log(`  Moderate (diffRatio <= 200%): ${moderate.length}`);
  console.log(`  Extreme  (diffRatio >  200%): ${extreme.length} (uyarı, manuel kontrol)`);
  console.log();

  if (extreme.length > 0) {
    console.log("⚠ EXTREME (manuel inceleme, fix uygulanır ama not düşülür):");
    for (const h of extreme.slice(0, 10)) {
      console.log(`  ${h.slug}: total=${h.totalMinutes} prep=${h.prepMinutes} cook=${h.cookMinutes} wait=${h.waitMinutes} expected=${h.expected} diff=${h.diff} ratio=${(h.diffRatio * 100).toFixed(0)}%`);
    }
    if (extreme.length > 10) console.log(`  ... +${extreme.length - 10} more`);
    console.log();
  }

  if (!APPLY) {
    console.log(`(dry-run, ${moderate.length} moderate kayıt --apply ile fix edilecek; ${extreme.length} extreme SKIP)`);
    await prisma.$disconnect();
    return;
  }

  // 21 extreme case'i SKIP, sadece 771 moderate'i fix et.
  const toFix = moderate;
  console.log(`Fix scope: ${toFix.length} moderate (extreme ${extreme.length} skipped, manuel inceleme listesi)\n`);

  // 1) Source patching: seed-recipes.ts totalMinutes regex update
  console.log("📂 Source patching (seed-recipes.ts)...");
  let content = fs.readFileSync(SOURCE_PATH, "utf-8");
  const lines = content.split("\n");
  let sourcePatched = 0;
  for (const h of toFix) {
    const lineIdx = lines.findIndex((l) => l.includes(`slug: "${h.slug}"`));
    if (lineIdx < 0) continue;
    // Replace totalMinutes: <any-num> (drift-tolerant: source value
    // may not equal DB value if previous fixes desyncéd them)
    const re = /totalMinutes:\s*\d+/;
    const newLine = lines[lineIdx].replace(re, `totalMinutes: ${h.expected}`);
    if (newLine !== lines[lineIdx]) {
      lines[lineIdx] = newLine;
      sourcePatched++;
    }
  }
  content = lines.join("\n");
  fs.writeFileSync(SOURCE_PATH, content);
  console.log(`  source patched: ${sourcePatched}/${toFix.length}`);
  console.log();

  // 2) DB update: batch
  console.log("💾 DB updating...");
  let dbUpdated = 0;
  for (let i = 0; i < toFix.length; i += 50) {
    const batch = toFix.slice(i, i + 50);
    await Promise.all(
      batch.map(async (h) => {
        await prisma.recipe.update({
          where: { id: h.id },
          data: { totalMinutes: h.expected },
        });
        await prisma.auditLog.create({
          data: {
            action: "GATE_A_TIME_FIX",
            targetType: "Recipe",
            targetId: h.id,
            metadata: {
              slug: h.slug,
              before: h.totalMinutes,
              after: h.expected,
              prep: h.prepMinutes,
              cook: h.cookMinutes,
              wait: h.waitMinutes,
              diffRatio: h.diffRatio,
              extreme: h.diffRatio > 2.0,
            },
          },
        });
        dbUpdated++;
      }),
    );
    if ((i + 50) % 200 === 0 || i + 50 >= toFix.length) {
      console.log(`  ${Math.min(i + 50, toFix.length)}/${toFix.length}...`);
    }
  }
  console.log(`  db updated: ${dbUpdated}/${toFix.length}`);

  await prisma.$disconnect();
  console.log("\n🎉 GATE A fix done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
