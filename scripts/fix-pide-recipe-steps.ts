/**
 * Tek-seferlik fix: enginarli-domatesli-pide-manisa-usulu tarifinin
 * stepsleri yetersizdi (kullanici geri bildirimi):
 *   - "Sebzeleri ince yerleştirin" -> enginar nasil hazirlanir bos
 *   - "Pideyi 18 dakika pişirin"   -> sicaklik eksik
 *
 * Bu degisiklik tarif kalitesi acisindan kucuk ama anlamli; benzer
 * boilerplate/eksik step pattern'i icin scripts/audit-step-quality.ts
 * gelecek pass'te yazilir.
 *
 * Yeni steps brief uyumlu (8-20 kelime, somut yontem + zaman + sicaklik).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SLUG = "enginarli-domatesli-pide-manisa-usulu";

const NEW_STEPS: { stepNumber: number; instruction: string; timerSeconds?: number }[] = [
  {
    stepNumber: 1,
    instruction:
      "Unu 1 çay kaşığı tuz ve 1 su bardağı ılık suyla yoğurun, 30 dakika dinlendirin.",
    timerSeconds: 1800,
  },
  {
    stepNumber: 2,
    instruction:
      "Enginar kalplerini ince dilimleyip limonlu suya bırakın, domatesleri küçük küp doğrayın.",
  },
  {
    stepNumber: 3,
    instruction:
      "Hamuru oval açın, kenarlarını yukarı kıvırın, içine domates ve enginarı yayıp zeytinyağı gezdirin.",
  },
  {
    stepNumber: 4,
    instruction:
      "Önceden 220°C ısıtılmış fırında 18 dakika kenarlar altın olana kadar pişirin.",
    timerSeconds: 1080,
  },
];

async function main() {
  assertDbTarget("fix-pide-recipe-steps");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const recipe = await prisma.recipe.findUnique({
    where: { slug: SLUG },
    select: { id: true, title: true },
  });
  if (!recipe) {
    console.error(`HATA: ${SLUG} bulunamadi`);
    process.exit(1);
  }

  console.log(`📝 Updating: ${recipe.title} (${SLUG})`);

  // Atomic: eski step'leri sil, yenilerini ekle. Translation JSON'i da
  // step icerigi tasiyabilir ama sema acik degil; sadece TR ana steps
  // dokunuyoruz, EN/DE translation block'unda step varsa Codex Mod B
  // sonraki turda re-translate edilebilir.
  await prisma.$transaction([
    prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } }),
    prisma.recipeStep.createMany({
      data: NEW_STEPS.map((s) => ({
        recipeId: recipe.id,
        stepNumber: s.stepNumber,
        instruction: s.instruction,
        timerSeconds: s.timerSeconds ?? null,
      })),
    }),
  ]);

  console.log(`✅ ${NEW_STEPS.length} yeni step yazildi`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
