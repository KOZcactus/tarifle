/**
 * Tek-step tarifelerin step parçalama (audit-content STEP_COUNT 2 HIGH).
 *
 * 2 tarif "Only 1 step(s), a real recipe typically has 3-10" flag:
 *   - muhallebili-elma-tatlisi-kastamonu-usulu: tek satırda muhallebi
 *     hazırlama, elma kısmı eksik. 5 step'e parçalanır.
 *   - sirnak-fistikli-kuzu-tava: tek satır fıstık serpme, ana et+sebze
 *     pişirme step'leri eksik. 5 step yazılır.
 *
 * Klasik tarif formülü web kontrolü:
 *   - Muhallebili elmalı: elma haşlama/kavurma + muhallebi pişirme +
 *     birleştirme + servis (Kastamonu yöresel)
 *   - Şırnak fıstıklı kuzu tava: kuyruk yağı kavurma + et tutturma +
 *     sebze ekleme + pişirme + fıstık serpme + servis
 *
 * Bu script mevcut tek step'i sileyip 5 yeni step yazar (idempotent
 * step count check ile).
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
const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface NewStep {
  stepNumber: number;
  instruction: string;
  timerSeconds?: number;
}

interface RecipeRewrite {
  slug: string;
  steps: NewStep[];
}

const REWRITES: RecipeRewrite[] = [
  {
    slug: "muhallebili-elma-tatlisi-kastamonu-usulu",
    // Mevcut ingredient: Elma 3, Süt 2sb, Mısır nişastası 2yk, Tarçın 0.25çk,
    // Toz şeker 3yk, Vanilya 1 paket. Klasik Kastamonu elmalı muhallebi:
    // elma rendelenip kısa kavrulur, muhallebi pişirilir, elma + muhallebi
    // kat halinde dizilir, üzerine tarçın serpilip soğukta dinlendirilir.
    steps: [
      { stepNumber: 1, instruction: "Elmaları soyup iri rendede rendeleyin; rengi koyulaşmasın diye fazla suyunu hafifçe sıkın." },
      { stepNumber: 2, instruction: "Rendelenmiş elmayı 1 yemek kaşığı şekerle yapışmaz tavada 5 dakika orta ateşte kavurup ocaktan alın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Sütü tencereye alın; nişasta, kalan şekeri ve vanilyayı çırpıcıyla pürüzsüz çözün, orta ateşte sürekli karıştırarak 8 dakika koyulaşana kadar pişirin.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Servis kâselerinin tabanına kavrulmuş elma yayın, üzerine sıcak muhallebiyi paylaştırın." },
      { stepNumber: 5, instruction: "Kâseleri 30 dakika buzdolabında dinlendirin; servis öncesi üzerine tarçın serpip soğuk ikram edin.", timerSeconds: 1800 },
    ],
  },
  {
    slug: "sirnak-fistikli-kuzu-tava",
    // Mevcut ingredient: Kuzu kuşbaşı 650gr, Antep fıstığı 0.5sb, Yeşil
    // biber 4, Domates 3, Kuyruk yağı 80gr. Klasik Şırnak fıstıklı kuzu
    // tava: kuyruk yağı kızdırılır, et kavrulur, biber ve domates eklenir,
    // birlikte pişirilir, fıstık son anda serpilir.
    steps: [
      { stepNumber: 1, instruction: "Kuzu kuşbaşıyı bol soğuk suda durulayıp süzdürün; havlu ile fazla nemini alın." },
      { stepNumber: 2, instruction: "Geniş tavada kuyruk yağını orta ateşte 3 dakika eritip eritti suyu çekene kadar 5 dakika daha kavurun, kıkırdaklarını ayırın.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Eti tavaya ekleyip suyunu salıp tekrar çekene kadar 12 dakika orta-yüksek ateşte tutturun; düzenli karıştırın.", timerSeconds: 720 },
      { stepNumber: 4, instruction: "Yeşil biberi büyük halkalar, domatesi küp doğrayıp tavaya ekleyin; kapağı kapalı 18 dakika kısık ateşte birlikte pişirin.", timerSeconds: 1080 },
      { stepNumber: 5, instruction: "Kıyılmış antep fıstığını son 2 dakikada serpip kavrulma kokusu çıkana dek karıştırın, sıcak servis edin.", timerSeconds: 120 },
    ],
  },
];

async function main(): Promise<void> {
  await assertDbTarget("fix-step-count-batch");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  for (const rw of REWRITES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: rw.slug },
      select: { id: true, steps: { select: { id: true, stepNumber: true, instruction: true } } },
    });
    if (!recipe) {
      console.log(`[skip] ${rw.slug}: not found`);
      continue;
    }
    if (recipe.steps.length >= 3) {
      console.log(`[skip] ${rw.slug}: zaten ${recipe.steps.length} step (idempotent)`);
      continue;
    }

    if (!APPLY) {
      console.log(`[plan] ${rw.slug}: ${recipe.steps.length} step → ${rw.steps.length} step`);
      for (const s of rw.steps) {
        console.log(`         ${s.stepNumber}. ${s.instruction.slice(0, 60)}...`);
      }
      continue;
    }

    // 1) Eski step'leri sil
    await prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
    // 2) Yeni step'leri ekle
    for (const s of rw.steps) {
      await prisma.recipeStep.create({
        data: {
          recipeId: recipe.id,
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          ...(s.timerSeconds ? { timerSeconds: s.timerSeconds } : {}),
        },
      });
    }
    await prisma.auditLog.create({
      data: {
        action: "RECIPE_STEPS_REWRITE",
        targetType: "Recipe",
        targetId: recipe.id,
        metadata: {
          recipeSlug: rw.slug,
          stepsBefore: recipe.steps.length,
          stepsAfter: rw.steps.length,
          oldInstructions: recipe.steps.map((s) => s.instruction),
          reason: "audit-content STEP_COUNT: 1 step → 5 step expansion (klasik formül)",
        },
      },
    });
    console.log(`[ok] ${rw.slug}: ${recipe.steps.length} → ${rw.steps.length} step`);
  }

  console.log(`\n${APPLY ? "APPLIED" : "DRY-RUN"} complete.`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
