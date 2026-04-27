/**
 * Tek-seferlik manuel düzeltme (oturum 25 GPT Paket 3): Adana Kebap'ta
 * Codex Mod K Batch 1a v2 marine süresini prepMinutes'a dahil etmiş
 * (prep 90 = 15 yoğur + 60 marine + 15 hazırlık), bu nedenle
 * RecipeTimeline `wait = total - prep - cook = 110 - 90 - 20 = 0`
 * hesaplıyor → marine segment görünmüyor.
 *
 * Brief §20.3 Kural 9 (oturum 25 sonu) netleştirildi: marine süresi
 * prepMinutes'a DAHİL EDİLMEMELİ, totalMinutes - prep - cook farkı
 * olarak korunmalı. Bu RecipeTimeline 3-segment (Hazırlık + Bekleme/
 * Marine + Pişirme) görünür hale getirir.
 *
 * Adana Kebap için doğru değerler:
 *   prepMinutes: 30  (15 yoğur + 15 hazırlık)
 *   cookMinutes: 20  (mangal/ızgara)
 *   totalMinutes: 110 (sabit)
 *   wait: 60  (otomatik hesap, Buzdolabında 1 saat dinlendirme)
 *
 * Idempotent: koşturulduğunda DB'de zaten doğru değerler varsa SKIP.
 *
 * Usage:
 *   npx tsx scripts/fix-adana-kebap-marine.ts                # dev (default)
 *   npx tsx scripts/fix-adana-kebap-marine.ts --env prod --confirm-prod
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
dotenv.config({
  path: path.resolve(__dirname2, "..", envFile),
  override: true,
});

async function main() {
  assertDbTarget("fix-adana-kebap-marine");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const slug = "adana-kebap";
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
    },
  });
  if (!recipe) {
    console.error(`${slug} bulunamadı`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("Mevcut:", recipe);
  if (recipe.prepMinutes === 30 && recipe.cookMinutes === 20 && recipe.totalMinutes === 110) {
    console.log("Zaten doğru, SKIP");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id: recipe.id },
      data: { prepMinutes: 30, cookMinutes: 20, totalMinutes: 110 },
    });
    await tx.auditLog.create({
      data: {
        action: "MOD_K_MARINE_FIX",
        userId: null,
        targetType: "Recipe",
        targetId: recipe.id,
        metadata: {
          slug,
          old: {
            prepMinutes: recipe.prepMinutes,
            cookMinutes: recipe.cookMinutes,
            totalMinutes: recipe.totalMinutes,
          },
          new: { prepMinutes: 30, cookMinutes: 20, totalMinutes: 110 },
          reason:
            "Brief §20.3 Kural 9 (oturum 25): marine süresi prepMinutes'a dahil edilmemeli. RecipeTimeline 3-segment görünür hale gelir.",
        },
      },
    });
  });

  console.log("✅ Updated: prep 30 + cook 20 + total 110, wait otomatik 60 (RecipeTimeline 3-segment)");
  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
