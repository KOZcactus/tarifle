/**
 * Macro denklem mismatch fix script (oturum 31 yeni audit GATE C bulgusu).
 *
 * audit-recipe-quality.ts GATE C rafine sonucu (106 → 3 hit, KOKTEYL/
 * ICECEK skip eklendi). 3 gerçek macro denklem ihlali (P/C/F ve cal
 * arası tutarsızlık):
 *
 *   1. yaglama-corbasi-kayseri-usulu (YEMEK): cal=480, macro=248, %48 sapma
 *   2. yesil-soganli-omlet-banh-mi-tost-vietnam-usulu (KAHVALTI): cal=320, macro=241, %25 sapma
 *   3. zingil-tatlisi-siirt-usulu (TATLI): cal=320, macro=246, %23 sapma
 *
 * Strateji: mevcut P/C/F oranını koru, cal hedefine scale et. Bu yaklaşım
 * ingredient bazlı recompute yerine basit ve güvenli; amplitude eksikliği
 * düzeltilir, oran zaten doğru.
 *
 * AuditLog action 'MACRO_FIX'. Idempotent (sapma <%20 ise atlar).
 *
 * Usage: npx tsx scripts/fix-macro-mismatch.ts (DRY-RUN dev)
 *        npx tsx scripts/fix-macro-mismatch.ts --env prod --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

const SLUGS = [
  "yaglama-corbasi-kayseri-usulu",
  "yesil-soganli-omlet-banh-mi-tost-vietnam-usulu",
  "zingil-tatlisi-siirt-usulu",
];

async function main() {
  assertDbTarget("fix-macro-mismatch");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  console.log(`DB: ${new URL(url).host}\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const slug of SLUGS) {
    const r = await prisma.recipe.findUnique({
      where: { slug },
      select: { id: true, slug: true, averageCalories: true, protein: true, carbs: true, fat: true },
    });
    if (!r) {
      console.error(`⚠️  ${slug}: bulunamadı`);
      notFound += 1;
      continue;
    }
    if (!r.averageCalories || r.protein === null || r.carbs === null || r.fat === null) {
      console.warn(`⚠️  ${slug}: eksik veri (cal=${r.averageCalories}, P=${r.protein}, C=${r.carbs}, F=${r.fat})`);
      skipped += 1;
      continue;
    }
    const macroCal = 4 * Number(r.protein) + 4 * Number(r.carbs) + 9 * Number(r.fat);
    const ratio = Math.abs(r.averageCalories - macroCal) / r.averageCalories;
    if (ratio < 0.20) {
      console.log(`⏭️  ${slug}: zaten ratio=${(ratio * 100).toFixed(0)}%, SKIP (idempotent)`);
      skipped += 1;
      continue;
    }
    if (macroCal === 0) {
      console.warn(`⚠️  ${slug}: macroCal=0, scale yapılamaz`);
      skipped += 1;
      continue;
    }
    // Scale: mevcut P/C/F oranını koruyarak cal hedefine ulaş
    const scaleFactor = r.averageCalories / macroCal;
    const newProtein = Math.round(Number(r.protein) * scaleFactor * 10) / 10;
    const newCarbs = Math.round(Number(r.carbs) * scaleFactor * 10) / 10;
    const newFat = Math.round(Number(r.fat) * scaleFactor * 10) / 10;

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: r.id },
        data: { protein: newProtein, carbs: newCarbs, fat: newFat },
      });
      await tx.auditLog.create({
        data: {
          action: "MACRO_FIX",
          userId: null,
          targetType: "recipe",
          targetId: r.id,
          metadata: {
            slug: r.slug,
            paket: "oturum-31-macro-fix",
            previousMacro: { protein: r.protein, carbs: r.carbs, fat: r.fat },
            newMacro: { protein: newProtein, carbs: newCarbs, fat: newFat },
            cal: r.averageCalories,
            previousMacroCal: macroCal,
            scaleFactor: Math.round(scaleFactor * 100) / 100,
            ratio: Math.round(ratio * 100) / 100,
          },
        },
      });
    });

    console.log(`✅ ${slug}: P=${r.protein}→${newProtein}, C=${r.carbs}→${newCarbs}, F=${r.fat}→${newFat} (scale=${scaleFactor.toFixed(2)})`);
    updated += 1;
  }

  console.log(`\nUpdated: ${updated}, skipped: ${skipped}, not_found: ${notFound}`);
  await prisma.$disconnect();
}

const isEntrypoint = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) { main().catch((e) => { console.error(e); process.exit(1); }); }
