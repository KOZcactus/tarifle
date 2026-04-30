/**
 * GATE A 5 marine timer fix (oturum 33 nihai temizlik).
 *
 * audit-recipe-quality.ts GATE A'da 5 hit marine pattern'inde:
 * - fes-harira: total fazla yüksek (500dk wait fantom, gerçekte yok)
 * - galbi: marine 30dk → 4 saat (Kore geleneği)
 * - kai-yang: marine 15dk → 3 saat (Tay geleneği)
 * - mersin sis dürüm: marine 10dk → 60dk
 * - bodrum çipura: marine timer null → 60dk ek
 *
 * Idempotent (mevcut değer hedef değerse skip). AuditLog action
 * GATE_A_MARINE_FIX. Gerçek tarif geleneklerine sadık, klasik formül
 * web kaynak doğrulama yapıldı.
 *
 * Usage:
 *   npx tsx scripts/fix-gate-a-marine-timers.ts (dev DRY-RUN)
 *   npx tsx scripts/fix-gate-a-marine-timers.ts --apply
 *   npx tsx scripts/fix-gate-a-marine-timers.ts --apply --env prod --confirm-prod
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
const APPLY = process.argv.includes("--apply");
const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface Fix {
  slug: string;
  changes: {
    totalMinutes?: number;
    stepFix?: { stepNumber: number; newTimerSeconds: number };
  };
  reason: string;
}

const FIXES: Fix[] = [
  // 1. round (oturum 33 ilk pass)
  {
    slug: "fes-harira",
    changes: { totalMinutes: 145 },
    reason: "Total 145: prep 30 + cook 70 + 45dk wait (step 4 45dk pişirme threshold üstü). 1. pass'ta 110'a düşürmüştüm, undershoot olmuş.",
  },
  {
    slug: "galbi",
    changes: { stepFix: { stepNumber: 2, newTimerSeconds: 14400 } }, // 4 saat
    reason: "Step 2 marine 30dk → 4 saat. Kore galbi geleneksel marinasyon süresi (BBC, Maangchi). Total 275 = 35 active + 240 marine, doğru.",
  },
  {
    slug: "kai-yang",
    changes: { totalMinutes: 225, stepFix: { stepNumber: 2, newTimerSeconds: 10800 } }, // 3 saat
    reason: "Step 2 marine 15dk → 3 saat. Tay kai yang geleneksel marinasyon (Hot Thai Kitchen, Serious Eats). Total 45 → 225 = prep 20 + cook 25 + 180 marine, brief 'marine totalMinutes'a dahil' uyumlu.",
  },
  {
    slug: "limonlu-susamli-tavuk-sis-durumu-mersin-usulu",
    changes: { totalMinutes: 88, stepFix: { stepNumber: 1, newTimerSeconds: 3600 } }, // 60dk
    reason: "Step 1 marine 10dk → 60dk. Sis dürümü tavuk marinasyonu min 60dk (yemek.com referans). Total 38 → 88 = prep 14 + cook 14 + 60 marine.",
  },
  {
    slug: "kekikli-cipura-izgara-bodrum-usulu",
    changes: { totalMinutes: 88, stepFix: { stepNumber: 1, newTimerSeconds: 3600 } }, // 60dk
    reason: "Step 1 'balığı marine edin' timer null → 60dk. Çipura kekik+limon+zeytinyağı marinasyon 30-60dk (Bodrum yöresel). Total 28 → 88 = prep 14 + cook 14 + 60 marine.",
  },
  // 2. round (oturum 33 audit re-run sonucu yeni 4 hit, totalMinutes adjustment)
  {
    slug: "lisbon-arroz-de-pato",
    changes: { totalMinutes: 185 },
    reason: "Total 120 → 185: prep 25 + cook 95 + 65dk wait (ördek pişirme + dinlenme). 41e Codex undershoot.",
  },
  {
    slug: "riyadh-chicken-kabsa",
    changes: { totalMinutes: 150 },
    reason: "Total 120 → 150: prep 25 + cook 65 + 60dk wait (kabsa marine + tencere dinlenme). 41e Codex undershoot.",
  },
  {
    slug: "kadinbudu-kofte",
    changes: { totalMinutes: 48 },
    reason: "Total 78 → 48: prep 30 + cook 18 + 0 wait (20dk dinlendirme < 30dk threshold). 41e overshoot.",
  },
  {
    slug: "cape-town-koeksisters",
    changes: { totalMinutes: 125 },
    reason: "Total 155 → 125: prep 35 + cook 30 + 60dk wait (şurupta soğutma). 41e overshoot.",
  },
];

async function main() {
  assertDbTarget("fix-gate-a-marine-timers");
  const url = process.env.DATABASE_URL!;
  console.log(`DB: ${new URL(url).host}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

  let updated = 0;
  let skipped = 0;
  try {
    for (const fix of FIXES) {
      const recipe = await prisma.recipe.findUnique({
        where: { slug: fix.slug },
        select: {
          id: true, slug: true, title: true, totalMinutes: true,
          steps: { select: { id: true, stepNumber: true, timerSeconds: true }, orderBy: { stepNumber: "asc" } },
        },
      });
      if (!recipe) {
        console.log(`⏭  ${fix.slug}: NOT FOUND`);
        continue;
      }

      let needsUpdate = false;
      const updateOps: { totalMinutes?: number; stepUpdate?: { id: string; newTimerSeconds: number } } = {};

      if (fix.changes.totalMinutes !== undefined && recipe.totalMinutes !== fix.changes.totalMinutes) {
        needsUpdate = true;
        updateOps.totalMinutes = fix.changes.totalMinutes;
      }

      if (fix.changes.stepFix) {
        const step = recipe.steps.find((s) => s.stepNumber === fix.changes.stepFix!.stepNumber);
        if (!step) {
          console.log(`⏭  ${fix.slug}: step ${fix.changes.stepFix.stepNumber} bulunamadı`);
          continue;
        }
        if (step.timerSeconds !== fix.changes.stepFix.newTimerSeconds) {
          needsUpdate = true;
          updateOps.stepUpdate = { id: step.id, newTimerSeconds: fix.changes.stepFix.newTimerSeconds };
        }
      }

      if (!needsUpdate) {
        console.log(`✅ ${fix.slug}: idempotent, zaten doğru`);
        skipped++;
        continue;
      }

      if (!APPLY) {
        console.log(`📝 ${fix.slug}: WOULD UPDATE`);
        if (updateOps.totalMinutes !== undefined) {
          console.log(`     totalMinutes ${recipe.totalMinutes} → ${updateOps.totalMinutes}`);
        }
        if (updateOps.stepUpdate) {
          const step = recipe.steps.find((s) => s.id === updateOps.stepUpdate!.id)!;
          console.log(`     step ${step.stepNumber} timerSeconds ${step.timerSeconds} → ${updateOps.stepUpdate.newTimerSeconds}`);
        }
        console.log(`     Sebep: ${fix.reason}`);
        continue;
      }

      await prisma.$transaction(async (tx) => {
        if (updateOps.totalMinutes !== undefined) {
          await tx.recipe.update({
            where: { id: recipe.id },
            data: { totalMinutes: updateOps.totalMinutes },
          });
        }
        if (updateOps.stepUpdate) {
          await tx.recipeStep.update({
            where: { id: updateOps.stepUpdate.id },
            data: { timerSeconds: updateOps.stepUpdate.newTimerSeconds },
          });
        }
        await tx.auditLog.create({
          data: {
            action: "GATE_A_MARINE_FIX",
            targetType: "recipe",
            targetId: recipe.id,
            metadata: {
              slug: fix.slug,
              changes: fix.changes,
              reason: fix.reason,
              previousTotalMinutes: recipe.totalMinutes,
              previousStepTimers: recipe.steps.map((s) => ({ stepNumber: s.stepNumber, timerSeconds: s.timerSeconds })),
            },
          },
        });
      });
      console.log(`✅ ${fix.slug}: UPDATED (${fix.reason.slice(0, 80)}...)`);
      updated++;
    }

    console.log(`\nSUMMARY: updated=${updated}, skipped=${skipped}, ${APPLY ? "APPLIED" : "DRY-RUN"}`);
    if (!APPLY) console.log(`ℹ  Apply için --apply ekle.`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
