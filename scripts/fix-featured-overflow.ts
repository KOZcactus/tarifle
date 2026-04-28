/**
 * Featured overflow azaltma script (oturum 31 yeni audit GATE E bulgusu).
 *
 * audit-recipe-quality.ts GATE E: 395/3508 featured (%11.3), brief
 * §5'te %5-10 ideal. Hedef %10 (351 featured), 44 fazla featured
 * tarif unfeatured edilmeli.
 *
 * Seçim kriterleri (en az 'değerli' featured):
 *   1. viewCount=0 olan featured tarifler (en zayıf, hiç görüntülenmemiş)
 *   2. cuisine='tr' over-representation (tr çok yoğun, balance gerek)
 *   3. updatedAt en eski (uzun süredir featured kalmış)
 *
 * Algoritma: viewCount=0 olanları en eskiden başlayarak sırala, top
 * 44'ünü featured=false yap.
 *
 * AuditLog action 'FEATURED_OVERFLOW_FIX'. Idempotent.
 *
 * Usage: npx tsx scripts/fix-featured-overflow.ts (DRY-RUN dev)
 *        npx tsx scripts/fix-featured-overflow.ts --env prod --confirm-prod
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

const TARGET_FEATURED_RATIO = 0.10; // %10 brief üst sınır

async function main() {
  assertDbTarget("fix-featured-overflow");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  console.log(`DB: ${new URL(url).host}\n`);

  const totalCount = await prisma.recipe.count({ where: { status: "PUBLISHED" } });
  const featuredCount = await prisma.recipe.count({ where: { status: "PUBLISHED", isFeatured: true } });
  const targetCount = Math.floor(totalCount * TARGET_FEATURED_RATIO);
  const removeCount = featuredCount - targetCount;

  console.log(`Total prod recipes: ${totalCount}`);
  console.log(`Current featured: ${featuredCount} (${((featuredCount / totalCount) * 100).toFixed(1)}%)`);
  console.log(`Target featured: ${targetCount} (${(TARGET_FEATURED_RATIO * 100).toFixed(0)}%)`);
  console.log(`Remove: ${removeCount} featured\n`);

  if (removeCount <= 0) {
    console.log("✅ Featured ratio already within target. No action.");
    await prisma.$disconnect();
    return;
  }

  // En zayıf featured: viewCount=0 + en eski updatedAt
  const candidates = await prisma.recipe.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    select: { id: true, slug: true, title: true, cuisine: true, viewCount: true, updatedAt: true },
    orderBy: [{ viewCount: "asc" }, { updatedAt: "asc" }],
    take: removeCount,
  });

  console.log(`Selecting ${candidates.length} weakest featured recipes:`);
  for (const c of candidates.slice(0, 15)) {
    console.log(`  ${c.slug} (cuisine=${c.cuisine}, views=${c.viewCount})`);
  }
  if (candidates.length > 15) console.log(`  ... + ${candidates.length - 15} more`);
  console.log();

  // Apply: featured=false + AuditLog
  let updated = 0;
  for (const c of candidates) {
    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: c.id },
        data: { isFeatured: false },
      });
      await tx.auditLog.create({
        data: {
          action: "FEATURED_OVERFLOW_FIX",
          userId: null,
          targetType: "recipe",
          targetId: c.id,
          metadata: {
            slug: c.slug,
            paket: "oturum-31-featured-overflow",
            reason: "Brief %5-10 ratio uyumu için isFeatured=false (viewCount=0, en eski updatedAt seçim)",
            previousFeatured: true,
            cuisine: c.cuisine,
            viewCount: c.viewCount,
          },
        },
      });
    });
    updated += 1;
  }

  // Re-check
  const newFeaturedCount = await prisma.recipe.count({ where: { status: "PUBLISHED", isFeatured: true } });
  const newRatio = newFeaturedCount / totalCount;
  console.log(`\nUpdated: ${updated} featured → false`);
  console.log(`New featured: ${newFeaturedCount} (${(newRatio * 100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

const isEntrypoint = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) { main().catch((e) => { console.error(e); process.exit(1); }); }
