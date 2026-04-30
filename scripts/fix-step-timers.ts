/**
 * Cooking mode timer zenginleştirme: step.instruction text'inde 'X dakika'
 * mention edilmiş ama step.timerSeconds null olan adımlara timer ekler.
 *
 * UX değeri: kullanıcı telefonunda Cooking Mode'u açıp tarif takip
 * ederken her adımda otomatik geri sayım çalışır. Şu an binlerce
 * adım timer'sız, kullanıcı süreyi step text'inden okuyup manuel
 * timer kurmak zorunda.
 *
 * Pattern matching:
 *   - "10 dakika pişirin" / "5-7 dakika kavurun" → 10dk veya orta (6dk)
 *   - "1 saat dinlendirin" → 60dk
 *   - "30 saniye karıştırın" → 30sn
 *   - Range: "5-10 dakika" → orta değer (7dk)
 *   - Plus: "10 dakika daha" → 10dk
 *
 * Heuristik: ilk geçen süre mention'ı kullanılır (genellikle ana iş süresi).
 *
 * Idempotent: timerSeconds zaten set ise atlanır. AuditLog action
 * STEP_TIMER_RETROFIT.
 *
 * Usage:
 *   npx tsx scripts/fix-step-timers.ts                     # dev DRY-RUN + CSV
 *   npx tsx scripts/fix-step-timers.ts --apply             # dev apply
 *   npx tsx scripts/fix-step-timers.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const APPLY = process.argv.includes("--apply");
const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface Extracted {
  seconds: number;
  source: string;
}

/**
 * Step instruction text'ten ilk süre mention'ını çıkarır ve saniye olarak
 * döner. Türkçe pattern: "X saniye/dakika/saat", "X-Y dakika" range,
 * "X.5 saat" decimal.
 */
function extractTimer(text: string): Extracted | null {
  // Range: "5-10 dakika" / "5 ila 10 dakika"
  const range = text.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(saniye|dakika|dk|saat|sa)\b/i);
  if (range) {
    const a = parseFloat(range[1].replace(",", "."));
    const b = parseFloat(range[2].replace(",", "."));
    const mid = (a + b) / 2;
    const seconds = unitToSeconds(mid, range[3]);
    return seconds > 0 ? { seconds, source: range[0] } : null;
  }
  // Single: "10 dakika" / "1 saat" / "30 saniye"
  const single = text.match(/(\d+(?:[.,]\d+)?)\s*(saniye|dakika|dk|saat|sa)\b/i);
  if (single) {
    const v = parseFloat(single[1].replace(",", "."));
    const seconds = unitToSeconds(v, single[2]);
    return seconds > 0 ? { seconds, source: single[0] } : null;
  }
  return null;
}

function unitToSeconds(value: number, unit: string): number {
  const u = unit.toLocaleLowerCase("tr-TR");
  if (u === "saniye") return Math.round(value);
  if (u === "dakika" || u === "dk") return Math.round(value * 60);
  if (u === "saat" || u === "sa") return Math.round(value * 3600);
  return 0;
}

interface PlannedFix {
  recipeSlug: string;
  stepId: string;
  stepNumber: number;
  instruction: string;
  extracted: string;
  newTimerSeconds: number;
}

async function main(): Promise<void> {
  await assertDbTarget("fix-step-timers");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Tüm step'ler timerSeconds null + instruction var
  const steps = await prisma.recipeStep.findMany({
    where: { timerSeconds: null },
    select: {
      id: true,
      stepNumber: true,
      instruction: true,
      recipe: { select: { slug: true } },
    },
  });
  console.log(`Total steps without timer: ${steps.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const planned: PlannedFix[] = [];
  for (const s of steps) {
    if (!s.recipe) continue;
    const ext = extractTimer(s.instruction);
    if (!ext) continue;
    // Sanity bound: 5sn-3 saat (excessive değerleri filtrele)
    if (ext.seconds < 5 || ext.seconds > 10800) continue;
    planned.push({
      recipeSlug: s.recipe.slug,
      stepId: s.id,
      stepNumber: s.stepNumber,
      instruction: s.instruction,
      extracted: ext.source,
      newTimerSeconds: ext.seconds,
    });
  }

  // CSV preview
  const csvPath = path.resolve(
    __dirname2,
    "..",
    `docs/step-timers-fix-plan-${isProd ? "prod" : "dev"}.csv`,
  );
  const escape = (s: string): string => `"${s.replace(/"/g, '""')}"`;
  const csvLines = [
    "recipeSlug,stepNumber,extractedText,newTimerSeconds,instruction",
    ...planned.map((p) => `${p.recipeSlug},${p.stepNumber},${escape(p.extracted)},${p.newTimerSeconds},${escape(p.instruction)}`),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  // Dağılım
  const byBucket: Record<string, number> = { "≤1dk": 0, "1-5dk": 0, "5-15dk": 0, "15-30dk": 0, "30-60dk": 0, "60+dk": 0 };
  for (const p of planned) {
    const m = p.newTimerSeconds / 60;
    if (m <= 1) byBucket["≤1dk"]++;
    else if (m <= 5) byBucket["1-5dk"]++;
    else if (m <= 15) byBucket["5-15dk"]++;
    else if (m <= 30) byBucket["15-30dk"]++;
    else if (m <= 60) byBucket["30-60dk"]++;
    else byBucket["60+dk"]++;
  }

  console.log(`Planlı timer ek: ${planned.length} step`);
  console.log(`Süre dağılımı:`);
  for (const [b, c] of Object.entries(byBucket)) {
    console.log(`  ${b}: ${c}`);
  }
  console.log(`\nCSV preview: ${csvPath}`);

  if (!APPLY) {
    console.log("\nDry-run. Apply için --apply.");
    await prisma.$disconnect();
    return;
  }

  let applied = 0;
  for (const p of planned) {
    await prisma.recipeStep.update({
      where: { id: p.stepId },
      data: { timerSeconds: p.newTimerSeconds },
    });
    await prisma.auditLog.create({
      data: {
        action: "STEP_TIMER_RETROFIT",
        targetType: "RecipeStep",
        targetId: p.stepId,
        metadata: {
          recipeSlug: p.recipeSlug,
          stepNumber: p.stepNumber,
          extractedText: p.extracted,
          newTimerSeconds: p.newTimerSeconds,
          reason: "step instruction süre mention'ından timer ekstrakte (cooking mode UX)",
        },
      },
    });
    applied++;
  }
  console.log(`\nAPPLIED: ${applied} timer retrofit`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
