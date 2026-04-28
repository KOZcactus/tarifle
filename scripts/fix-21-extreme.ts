/**
 * GATE A 21 extreme manuel fix paketi (oturum 32):
 *
 * Her tarif tek tek incelendi. Fix tipleri:
 *
 * Tip A: cookMinutes'a passive süre (soğutma/dinlenme) ekleme
 *   (yoğurt kup tatlıları, sos dinlenme)
 *
 * Tip B: step instruction'a marine/soğutma timerSeconds ekleme
 *   (hanoi-bun-cha 4 saat marine, soguk-cay 2 saat soğutma)
 *
 * Tip C: total fazla yüksek anomali, totalMinutes düşürme
 *   (piyaz 780→100, sivas-peskutan 785→95, tokat-baklali 820→153,
 *    selanik-gigantes 830→195, sinop-keskek 865→258, lemon-slice 85→25)
 *
 * Tip D: total = expected zaten doğru, audit yanlış flag (skip)
 *   (corum-keskek, hardalli-artsoppa, kars-piti, amasya-keskek, kvass,
 *    rize-pepecura)
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

const SOURCE_PATH = path.resolve("scripts/seed-recipes.ts");

interface CookFix { slug: string; cook: number; total: number; reason: string }
interface TotalFix { slug: string; total: number; reason: string }
interface StepTimerFix { slug: string; stepNumber: number; timerSec: number; reason: string }

const COOK_FIXES: CookFix[] = [
  { slug: "turron-yogurt-kup-ispanya-usulu", cook: 25, total: 35, reason: "25dk soğutma cookMinutes'a" },
  { slug: "incirli-yulaf-kup-aydin-usulu", cook: 30, total: 38, reason: "20dk yulaf yumuşatma + 10dk soğutma cookMinutes'a" },
  { slug: "blueberry-oat-kup-amerikan-usulu", cook: 30, total: 38, reason: "20dk yulaf dinlenme + 10dk soğutma cookMinutes'a" },
  { slug: "lamington-yogurt-kup-avustralya-usulu", cook: 21, total: 31, reason: "1dk çırpma + 20dk soğutma cookMinutes'a" },
  { slug: "naneli-seftalili-soguk-cay-mugla-usulu", cook: 5, total: 13, reason: "5dk demleme cookMinutes'a" },
  { slug: "atom-sos", cook: 15, total: 20, reason: "15dk dinlenme cookMinutes'a" },
  // Round 2: prod'da yeni hit edilen extremeler
  { slug: "lamington-kakaolu-kup-avustralya-usulu", cook: 27, total: 35, reason: "kakaolu lamington kup soğutma cookMinutes'a" },
  { slug: "mizeria-polonya-yaz-usulu", cook: 25, total: 35, reason: "salata dinlenme cookMinutes'a" },
  { slug: "ponzu-sos", cook: 25, total: 33, reason: "sos dinlenme cookMinutes'a" },
  { slug: "portakal-cicekli-soguk-cay-fas-usulu", cook: 20, total: 28, reason: "soğuk çay demleme + soğutma cookMinutes'a" },
  { slug: "mandalinali-reyhan-serbeti-aydin-usulu", cook: 20, total: 28, reason: "şerbet demleme + soğutma cookMinutes'a" },
  { slug: "lucumali-yogurt-kupu-peru-usulu", cook: 20, total: 28, reason: "kup soğutma cookMinutes'a" },
];

const TOTAL_FIXES: TotalFix[] = [
  { slug: "piyaz", total: 100, reason: "12 saat marine totalMinutes'tan çıkar (kullanıcı pratik süre)" },
  { slug: "sivas-peskutan-corbasi", total: 95, reason: "anomali fix, 13 saat → 95dk" },
  { slug: "tokat-baklali-yaprak-sarma", total: 153, reason: "12 saat bakla marine totalMinutes'tan çıkar" },
  { slug: "selanik-fasulyeli-gigantes", total: 195, reason: "12 saat fasulye marine totalMinutes'tan çıkar" },
  { slug: "sinop-nohutlu-keskek", total: 258, reason: "10 saat buğday marine totalMinutes'tan çıkar" },
  { slug: "lemon-slice-avustralya-usulu", total: 55, reason: "30dk soğutma cookMinutes'a tutarlılık" },
  // Round 2: prod hardalli total 810 yanlış (dev'de 160 zaten doğru)
  { slug: "hardalli-artsoppa", total: 160, reason: "geceden bezelye ıslama totalMinutes'tan çıkar (12 saat marine)" },
];

// Step timer ekleme (marine/soğutma süresi text'te var, timerSeconds eksik)
const STEP_TIMER_FIXES: StepTimerFix[] = [
  { slug: "hanoi-bun-cha", stepNumber: 2, timerSec: 14400, reason: "4 saat ızgara marine, tip note'ta belirtilmiş" },
  { slug: "soguk-cay", stepNumber: 4, timerSec: 7200, reason: "2 saat buzdolabı soğutma step text'inde" },
];

// Lemon slice için ayrıca cook artır (10→30)
const LEMON_SLICE_COOK_FIX: CookFix = {
  slug: "lemon-slice-avustralya-usulu",
  cook: 30,
  total: 55,
  reason: "10dk fırın + 20dk taban soğutma cookMinutes'a (toplam 30dk pasif/aktif)",
};

async function main() {
  const target = assertDbTarget("fix-21-extreme");
  console.log(`💾 DB: ${target.host}\n`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
  let content = fs.readFileSync(SOURCE_PATH, "utf-8");

  // 1) Cook + total fixes (lemon-slice dahil)
  const allCookFixes = [...COOK_FIXES, LEMON_SLICE_COOK_FIX];
  console.log("📌 Cook + total fixes:");
  for (const fix of allCookFixes) {
    const r = await prisma.recipe.findUnique({ where: { slug: fix.slug }, select: { id: true, cookMinutes: true, totalMinutes: true } });
    if (!r) { console.log(`  ⚠ ${fix.slug}: not in DB`); continue; }
    if (r.cookMinutes !== fix.cook || r.totalMinutes !== fix.total) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { cookMinutes: fix.cook, totalMinutes: fix.total },
      });
      await prisma.auditLog.create({
        data: {
          action: "GATE_A_EXTREME_FIX",
          targetType: "Recipe",
          targetId: r.id,
          metadata: { slug: fix.slug, type: "cook+total", before: { cook: r.cookMinutes, total: r.totalMinutes }, after: { cook: fix.cook, total: fix.total }, reason: fix.reason },
        },
      });
      console.log(`  ✅ ${fix.slug}: cook ${r.cookMinutes}→${fix.cook}, total ${r.totalMinutes}→${fix.total}`);
    } else {
      console.log(`  ⏭ ${fix.slug}: already correct`);
    }
    // Source patch
    const lines = content.split("\n");
    const lineIdx = lines.findIndex((l) => l.includes(`slug: "${fix.slug}"`));
    if (lineIdx >= 0) {
      let line = lines[lineIdx];
      line = line.replace(/cookMinutes:\s*\d+/, `cookMinutes: ${fix.cook}`);
      line = line.replace(/totalMinutes:\s*\d+/, `totalMinutes: ${fix.total}`);
      if (line !== lines[lineIdx]) {
        lines[lineIdx] = line;
        content = lines.join("\n");
      }
    }
  }

  // 2) Total-only fixes
  console.log("\n📌 Total-only fixes:");
  for (const fix of TOTAL_FIXES) {
    if (fix.slug === "lemon-slice-avustralya-usulu") continue; // handled above
    const r = await prisma.recipe.findUnique({ where: { slug: fix.slug }, select: { id: true, totalMinutes: true } });
    if (!r) { console.log(`  ⚠ ${fix.slug}: not in DB`); continue; }
    if (r.totalMinutes !== fix.total) {
      await prisma.recipe.update({ where: { id: r.id }, data: { totalMinutes: fix.total } });
      await prisma.auditLog.create({
        data: {
          action: "GATE_A_EXTREME_FIX",
          targetType: "Recipe",
          targetId: r.id,
          metadata: { slug: fix.slug, type: "total", before: r.totalMinutes, after: fix.total, reason: fix.reason },
        },
      });
      console.log(`  ✅ ${fix.slug}: total ${r.totalMinutes}→${fix.total}`);
    } else {
      console.log(`  ⏭ ${fix.slug}: already correct`);
    }
    const lines = content.split("\n");
    const lineIdx = lines.findIndex((l) => l.includes(`slug: "${fix.slug}"`));
    if (lineIdx >= 0) {
      const line = lines[lineIdx].replace(/totalMinutes:\s*\d+/, `totalMinutes: ${fix.total}`);
      if (line !== lines[lineIdx]) {
        lines[lineIdx] = line;
        content = lines.join("\n");
      }
    }
  }

  // 3) Step timer fixes
  console.log("\n📌 Step timer fixes:");
  for (const fix of STEP_TIMER_FIXES) {
    const r = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, steps: { select: { id: true, stepNumber: true, timerSeconds: true } } },
    });
    if (!r) { console.log(`  ⚠ ${fix.slug}: not in DB`); continue; }
    const step = r.steps.find((s) => s.stepNumber === fix.stepNumber);
    if (!step) { console.log(`  ⚠ ${fix.slug} step ${fix.stepNumber}: not found`); continue; }
    if (step.timerSeconds !== fix.timerSec) {
      await prisma.recipeStep.update({ where: { id: step.id }, data: { timerSeconds: fix.timerSec } });
      await prisma.auditLog.create({
        data: {
          action: "GATE_A_EXTREME_FIX",
          targetType: "Recipe",
          targetId: r.id,
          metadata: { slug: fix.slug, type: "step-timer", stepNumber: fix.stepNumber, before: step.timerSeconds, after: fix.timerSec, reason: fix.reason },
        },
      });
      console.log(`  ✅ ${fix.slug} step ${fix.stepNumber}: timer ${step.timerSeconds}→${fix.timerSec}s`);
    } else {
      console.log(`  ⏭ ${fix.slug} step ${fix.stepNumber}: already correct`);
    }
  }

  fs.writeFileSync(SOURCE_PATH, content);
  console.log(`\n📂 source patched`);
  await prisma.$disconnect();
  console.log("\n🎉 21 extreme fix done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
