/**
 * cookMinutes alanını step timer toplamına yaklaştır (oturum 34, parça 2).
 *
 * Gözlem (TIME_GAP audit dump'tan): birçok tarifin step timer toplamı
 * cookMinutes'tan büyük. Yani step text'inde gerçek pişirme süreleri
 * doğru kayıtlı ama cookMinutes alanı eksik tahmin edilmiş.
 *
 * Sample:
 *   lahore-nihari: cookMinutes=300, timerSum=300, total=610, gap=280
 *   konya-firin-kebabi: cookMinutes=180, timerSum=170, total=340, gap=150
 *   boeuf-bourguignon: cookMinutes=150, timerSum=170, total=335, gap=150
 *
 * Strateji: cookMinutes < timerSum ise cookMinutes'ı timerSum'a yükselt.
 * Total değişmez (wait/marine süresi total'de doğal kalır). Gap düşer.
 *
 * Sanity:
 *   - cookMinutes asla totalMinutes'tan büyük olmaz (cap)
 *   - prep+cook total'i geçmez (cook = total - prep cap)
 *   - sadece cookMinutes < timerSum farkı 5dk+ olanları yükselt
 *
 * Idempotent: cookMinutes >= timerSum ise atlar. AuditLog action
 * RECIPE_TIME_FIX.
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

interface PlannedFix {
  recipeSlug: string;
  prep: number;
  oldCook: number;
  newCook: number;
  total: number;
  timerSum: number;
}

async function main(): Promise<void> {
  await assertDbTarget("fix-cook-minutes-from-timers");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      steps: { select: { instruction: true, timerSeconds: true } },
    },
  });

  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  // Marina/wait keyword'leri: bu step'lerin timer'ı cookMinutes'a değil
  // total'de zaten dahil edilen wait süresi. Aktif pişirme değil.
  const MARINA_RE = /\b(marine|dinlendir|beklet|soğut|buzdolab|gecelik|gece boyu|gecede|mayalan|kabar|fermente|kürle|salamur|tuzlay|ıslat|kurutmaya|dinlenmeye|asılı|asılan|asarak|şerbet çek|şerbet çeksin|kurutma|kuruma)\w*/u;

  const planned: PlannedFix[] = [];
  for (const r of recipes) {
    let activeTimerSec = 0;
    for (const s of r.steps) {
      if (!s.timerSeconds) continue;
      const text = (s.instruction ?? "").toLocaleLowerCase("tr-TR");
      if (MARINA_RE.test(text)) continue; // wait timer, skip
      activeTimerSec += s.timerSeconds;
    }
    const timerSum = Math.round(activeTimerSec / 60);
    if (timerSum <= r.cookMinutes + 4) continue; // 5dk altı fark skip
    // Sanity guards:
    // 1. yeni cook total - prep'i geçmesin
    const maxCook = Math.max(r.totalMinutes - r.prepMinutes, r.cookMinutes);
    const newCook = Math.min(timerSum, maxCook);
    // 2. Delta > 60dk skip (büyük artış manuel review gerek, marina
    //    kalıntısı veya extreme braise olabilir)
    if (newCook - r.cookMinutes > 60) continue;
    // 3. newCook 360dk (6 saat) üstü skip (extreme cook süresi)
    if (newCook > 360) continue;
    if (newCook === r.cookMinutes) continue;
    planned.push({
      recipeSlug: r.slug,
      prep: r.prepMinutes,
      oldCook: r.cookMinutes,
      newCook,
      total: r.totalMinutes,
      timerSum,
    });
  }

  // CSV
  const csvPath = path.resolve(
    __dirname2,
    "..",
    `docs/cook-minutes-fix-plan-${isProd ? "prod" : "dev"}.csv`,
  );
  const lines = [
    "slug,prep,oldCook,newCook,total,timerSum",
    ...planned.map((p) => `${p.recipeSlug},${p.prep},${p.oldCook},${p.newCook},${p.total},${p.timerSum}`),
  ];
  fs.writeFileSync(csvPath, lines.join("\n"), "utf8");

  console.log(`Planlı fix: ${planned.length}`);
  console.log(`Sample (ilk 8):`);
  for (const p of planned.slice(0, 8)) {
    console.log(
      `  ${p.recipeSlug}: cook ${p.oldCook} → ${p.newCook} (timerSum=${p.timerSum}, total=${p.total}, prep=${p.prep})`,
    );
  }
  console.log(`\nCSV: ${csvPath}`);

  if (!APPLY) {
    console.log("\nDry-run. Apply için --apply.");
    await prisma.$disconnect();
    return;
  }

  let applied = 0;
  for (const p of planned) {
    const r = await prisma.recipe.findUnique({ where: { slug: p.recipeSlug }, select: { id: true } });
    if (!r) continue;
    await prisma.recipe.update({ where: { id: r.id }, data: { cookMinutes: p.newCook } });
    await prisma.auditLog.create({
      data: {
        action: "RECIPE_TIME_FIX",
        targetType: "Recipe",
        targetId: r.id,
        metadata: {
          recipeSlug: p.recipeSlug,
          field: "cookMinutes",
          before: p.oldCook,
          after: p.newCook,
          context: { prep: p.prep, total: p.total, timerSum: p.timerSum },
          reason: "step timer toplamı cookMinutes'tan büyük, cookMinutes timerSum'a yükseltildi (TIME_GAP fix)",
        },
      },
    });
    applied++;
  }
  console.log(`\nAPPLIED: ${applied} cookMinutes update`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
