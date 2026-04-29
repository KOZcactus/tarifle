/**
 * Codex Mod R batch sonrası recipe.imageUrl update (oturum 33 yeni).
 *
 * Codex `public/recipe-images/generated/<slug>.webp` dosyalarını
 * üretip kaydettikten sonra bu script çalıştırılır:
 * 1. queue-batch-N.json'u okur
 * 2. Her slug için public/recipe-images/generated/<slug>.webp var mı bakar
 * 3. Varsa: recipe.imageUrl = "/recipe-images/generated/<slug>.webp" set
 *    Yoksa: skip + uyarı (Codex retry exhausted veya henüz üretmedi)
 * 4. AuditLog her update için (RECIPE_IMAGE_APPLY)
 *
 * Idempotent: aynı slug için imageUrl zaten doğruysa skip.
 *
 * Usage:
 *   npx tsx scripts/apply-recipe-images.ts --batch N           # dev DRY-RUN
 *   npx tsx scripts/apply-recipe-images.ts --batch N --apply   # dev apply
 *   npx tsx scripts/apply-recipe-images.ts --batch N --apply --confirm-prod  # prod apply
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
const args = process.argv.slice(2);
const batchIdx = args.indexOf("--batch");
const batch = batchIdx >= 0 ? args[batchIdx + 1] : null;
const APPLY = args.includes("--apply");
const isProdMode = args.includes("--confirm-prod");
const envFile = isProdMode ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface QueueEntry {
  slug: string;
  title: string;
}

async function main() {
  if (!batch) {
    console.error("❌ --batch N gerekli.");
    process.exit(1);
  }
  assertDbTarget("apply-recipe-images");

  const queueFile = path.resolve(`docs/recipe-image-prompts/queue-batch-${batch}.json`);
  if (!fs.existsSync(queueFile)) {
    console.error(`❌ Queue dosyası yok: ${queueFile}`);
    process.exit(1);
  }
  const queue: QueueEntry[] = JSON.parse(fs.readFileSync(queueFile, "utf-8"));
  console.log(`📋 Batch ${batch} queue: ${queue.length} tarif`);

  const url = process.env.DATABASE_URL!;
  console.log(`🔌 DB: ${new URL(url).host}`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

  const imagesDir = path.resolve("public/recipe-images/generated");
  const results: { slug: string; status: "applied" | "skipped" | "missing" | "noop"; reason?: string }[] = [];

  try {
    for (const entry of queue) {
      const imagePath = path.join(imagesDir, `${entry.slug}.webp`);
      const expectedUrl = `/recipe-images/generated/${entry.slug}.webp`;
      if (!fs.existsSync(imagePath)) {
        results.push({ slug: entry.slug, status: "missing", reason: "dosya yok" });
        continue;
      }
      const recipe = await prisma.recipe.findUnique({
        where: { slug: entry.slug },
        select: { id: true, imageUrl: true },
      });
      if (!recipe) {
        results.push({ slug: entry.slug, status: "missing", reason: "DB'de slug yok" });
        continue;
      }
      if (recipe.imageUrl === expectedUrl) {
        results.push({ slug: entry.slug, status: "noop", reason: "imageUrl zaten doğru" });
        continue;
      }

      if (!APPLY) {
        results.push({ slug: entry.slug, status: "skipped", reason: "DRY-RUN" });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.recipe.update({
          where: { id: recipe.id },
          data: { imageUrl: expectedUrl },
        });
        await tx.auditLog.create({
          data: {
            action: "RECIPE_IMAGE_APPLY",
            targetType: "recipe",
            targetId: recipe.id,
            metadata: {
              slug: entry.slug,
              batch,
              previousImageUrl: recipe.imageUrl,
              newImageUrl: expectedUrl,
              source: "codex-mod-r",
            },
          },
        });
      });
      results.push({ slug: entry.slug, status: "applied" });
    }

    // Summary
    const applied = results.filter((r) => r.status === "applied").length;
    const noop = results.filter((r) => r.status === "noop").length;
    const missing = results.filter((r) => r.status === "missing");
    const skipped = results.filter((r) => r.status === "skipped").length;
    console.log(`\n=== SUMMARY ===`);
    console.log(`Applied: ${applied}`);
    console.log(`Idempotent (zaten doğru): ${noop}`);
    console.log(`Missing (dosya/DB yok): ${missing.length}`);
    console.log(`Dry-run skipped: ${skipped}`);
    if (missing.length > 0) {
      console.log(`\nMissing detay:`);
      for (const m of missing) console.log(`  - ${m.slug}: ${m.reason}`);
    }
    if (!APPLY) {
      console.log(`\nℹ  DRY-RUN. Apply için --apply ekle.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
