/**
 * GATE E featured overflow fix (oturum 33 nihai temizlik).
 *
 * audit-recipe-quality.ts GATE E: 390/3711 = %10.5 featured (brief
 * kuralı %5-10). Hedef: %10.0 ya da altı (= 371 max featured, 19 fazla).
 *
 * Strateji: featured + viewCount=0 + en eski createdAt 19 tarifi
 * unfeature et. Bunlar henüz hiç görünmemiş + ana cycle dışı featured
 * adayları. AuditLog action GATE_E_UNFEATURE.
 *
 * Yeni Mod A v2 batch'lerini (40a-e + 41a-e) korumak öncelik: bu
 * batch'lerin featured kararları kasıtlı yapıldı. Eski mod cycle'ından
 * gelen featured'ları azalt.
 *
 * Idempotent (zaten unfeatured ise skip). Hedefe ulaşana kadar.
 *
 * Usage:
 *   npx tsx scripts/fix-gate-e-featured-overflow.ts                       # dev DRY-RUN
 *   npx tsx scripts/fix-gate-e-featured-overflow.ts --apply                # dev apply
 *   npx tsx scripts/fix-gate-e-featured-overflow.ts --apply --env prod --confirm-prod
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

const TARGET_FEATURED_RATIO = 0.10; // %10.0 hedef

async function main() {
  assertDbTarget("fix-gate-e-featured-overflow");
  const url = process.env.DATABASE_URL!;
  console.log(`DB: ${new URL(url).host}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

  try {
    const total = await prisma.recipe.count();
    const featured = await prisma.recipe.count({ where: { isFeatured: true } });
    const ratio = featured / total;
    console.log(`Mevcut: ${featured}/${total} featured (${(ratio * 100).toFixed(2)}%)`);

    const targetFeatured = Math.floor(total * TARGET_FEATURED_RATIO);
    const toUnfeature = featured - targetFeatured;
    console.log(`Hedef: ≤${targetFeatured} featured (${(TARGET_FEATURED_RATIO * 100).toFixed(1)}%)`);
    console.log(`Kaldırılacak: ${toUnfeature} tarif\n`);

    if (toUnfeature <= 0) {
      console.log(`✅ Zaten target altında, no-op.`);
      return;
    }

    // Adaylar: featured + ESKİ batch (2026-04-28 öncesi) + en düşük
    // viewCount + en eski createdAt. Yeni Mod A v2 batch'leri (40a-e
    // ve sonrası, oturum 32+) korunur, featured kararları kasıtlı.
    const NEW_BATCH_CUTOFF = new Date("2026-04-28T00:00:00Z");
    const candidates = await prisma.recipe.findMany({
      where: {
        isFeatured: true,
        createdAt: { lt: NEW_BATCH_CUTOFF },
      },
      orderBy: [{ viewCount: "asc" }, { createdAt: "asc" }],
      take: toUnfeature,
      select: { id: true, slug: true, title: true, createdAt: true, viewCount: true },
    });

    console.log(`Aday liste (${candidates.length} tarif, viewCount=0 + en eski):\n`);
    for (const r of candidates) {
      console.log(`  - ${r.slug} (created ${r.createdAt.toISOString().slice(0, 10)}, views ${r.viewCount})`);
    }
    console.log();

    if (!APPLY) {
      console.log(`ℹ  DRY-RUN. Apply için --apply ekle.`);
      return;
    }

    let updated = 0;
    for (const r of candidates) {
      await prisma.$transaction(async (tx) => {
        await tx.recipe.update({
          where: { id: r.id },
          data: { isFeatured: false },
        });
        await tx.auditLog.create({
          data: {
            action: "GATE_E_UNFEATURE",
            targetType: "recipe",
            targetId: r.id,
            metadata: {
              slug: r.slug,
              title: r.title,
              previousIsFeatured: true,
              reason: `GATE E overflow ${(ratio * 100).toFixed(2)}% → hedef ${(TARGET_FEATURED_RATIO * 100).toFixed(1)}%, viewCount=0 + en eski createdAt aday`,
              createdAt: r.createdAt.toISOString(),
            },
          },
        });
      });
      updated++;
    }

    const newFeatured = await prisma.recipe.count({ where: { isFeatured: true } });
    const newRatio = newFeatured / total;
    console.log(`\n✅ ${updated} tarif unfeatured`);
    console.log(`Yeni durum: ${newFeatured}/${total} featured (${(newRatio * 100).toFixed(2)}%)`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
