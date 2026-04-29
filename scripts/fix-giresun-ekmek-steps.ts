/**
 * Source-DB drift fix for `misir-unlu-yagli-ekmek-giresun-usulu`.
 *
 * TIER 2 cluster review (oturum 33) sırasında prod DB'de 6 adımlı versiyon
 * tespit edildi: step 1-2 boilerplate (GATE 5) + slug-leak (GATE 6) içeriyor.
 * Source-of-truth `scripts/seed-recipes.ts` ise 3 adımlı temiz versiyon
 * tutuyor. Eski Mod K retrofit kalıntısı, audit-recipe-quality.ts kaçırmış.
 *
 * Bu script: prod DB step listesi → source ile aynı temiz 3 adıma sync eder,
 * AuditLog yazar, idempotent (aynı içerik tekrar koşturursa no-op).
 *
 * Usage:
 *   npx tsx scripts/fix-giresun-ekmek-steps.ts                # dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-giresun-ekmek-steps.ts --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "path";
import { assertDbTarget } from "./lib/db-env";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local"), override: false });

const SLUG = "misir-unlu-yagli-ekmek-giresun-usulu";

// Source-of-truth steps (scripts/seed-recipes.ts:11033 ile aynı)
const CLEAN_STEPS = [
  { stepNumber: 1, instruction: "Mısır unu, un, su ve tuzu karıştırıp koyu bir hamur hazırlayın.", timerSeconds: null as number | null },
  { stepNumber: 2, instruction: "Hamuru yağlanmış tavaya yayıp iki yüzünü toplam 18 dakika pişirin.", timerSeconds: 1080 },
  { stepNumber: 3, instruction: "Ekmeği dilimleyip üzerine tereyağı sürerek servis edin.", timerSeconds: null },
];

async function main() {
  assertDbTarget("fix-giresun-ekmek-steps");
  const url = process.env.DATABASE_URL!;
  console.log(`🔌 Bağlanılan DB host: ${new URL(url).host}`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: SLUG },
      select: { id: true, title: true, steps: { orderBy: { stepNumber: "asc" } } },
    });
    if (!recipe) {
      console.log(`⏭  ${SLUG} bulunamadı, skip.`);
      return;
    }
    console.log(`📋 Mevcut step sayısı: ${recipe.steps.length}`);
    for (const s of recipe.steps) {
      console.log(`   ${s.stepNumber}. ${s.instruction.slice(0, 80)}${s.instruction.length > 80 ? "..." : ""}`);
    }

    const sameLength = recipe.steps.length === CLEAN_STEPS.length;
    const sameContent = sameLength && recipe.steps.every((db, idx) =>
      db.instruction === CLEAN_STEPS[idx]!.instruction &&
      db.stepNumber === CLEAN_STEPS[idx]!.stepNumber,
    );
    if (sameContent) {
      console.log(`✅ Idempotent: DB zaten source ile aynı, no-op.`);
      return;
    }

    console.log(`\n📝 Yeni temiz step seti uygulanıyor:`);
    for (const s of CLEAN_STEPS) {
      console.log(`   ${s.stepNumber}. ${s.instruction}`);
    }

    await prisma.$transaction(async (tx) => {
      // Eski step'leri sil + yeniden yaz (cleanest, stepNumber re-index)
      await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
      await tx.recipeStep.createMany({
        data: CLEAN_STEPS.map((s) => ({
          recipeId: recipe.id,
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          timerSeconds: s.timerSeconds,
        })),
      });
      await tx.auditLog.create({
        data: {
          action: "FIX_RECIPE_STEPS",
          targetType: "recipe",
          targetId: recipe.id,
          metadata: {
            slug: SLUG,
            reason: "TIER 2 source-DB drift fix: GATE 5 boilerplate + GATE 6 slug-leak temizlik",
            beforeStepCount: recipe.steps.length,
            afterStepCount: CLEAN_STEPS.length,
          },
        },
      });
    });
    console.log(`\n✅ Step seti güncellendi (${recipe.steps.length} → ${CLEAN_STEPS.length}), AuditLog yazıldı.`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
