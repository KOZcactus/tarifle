/**
 * Step instruction çok kısa (audit-content STEP_TOO_SHORT) manuel expand.
 *
 * Audit refine sonrası kalan 21 hit gerçekten yetersiz tek-eylem step'ler.
 * Her biri spesifik tarif bağlamında manuel rewrite.
 *
 * Pattern grupları:
 *   - 'Buzu/Buz ekleyin' → bardağa buz + içeceği dökme detayı
 *   - 'X doğrayın' → boyut + hazırlık detayı
 *   - 'Y ekleyin' → miktar + nasıl detayı
 *   - 'Soğanı kavurun' → süre + ateş + sonuç
 *   - 'Çayı soğutun' → süre + sıcaklık
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

interface Fix {
  recipeSlug: string;
  stepNumber: number;
  before: string;
  after: string;
}

const FIXES: Fix[] = [
  // 'Buzu/Buz ekleyin' (7 hit, içecek/kokteyl pattern)
  { recipeSlug: "orange-mint-cooler-orta-dogu-usulu", stepNumber: 2, before: "Buz ekleyin.", after: "Bardağa bol buz koyup karışımı yavaşça buz üzerine dökün." },
  { recipeSlug: "pineapple-rum-fizz-kuba-usulu", stepNumber: 2, before: "Buzu ekleyin.", after: "Bardağa bol buz koyup içeceği yavaşça buz üzerine dökün." },
  { recipeSlug: "pisco-zencefil-fizz-peru-usulu", stepNumber: 2, before: "Buzu ekleyin.", after: "Bardağa bol buz koyup içeceği yavaşça buz üzerine dökün." },
  { recipeSlug: "mango-lime-soda-vietnam-usulu", stepNumber: 2, before: "Buzu ekleyin.", after: "Bardağa bol buz koyup karışımı yavaşça buz üzerine dökün." },
  { recipeSlug: "passionfruit-pisco-spritz-peru-usulu", stepNumber: 2, before: "Buzu ekleyin.", after: "Bardağa bol buz koyup karışımı yavaşça buz üzerine dökün." },
  { recipeSlug: "guava-rum-cooler-kuba-usulu", stepNumber: 2, before: "Buzu ekleyin.", after: "Bardağa bol buz koyup karışımı yavaşça buz üzerine dökün." },
  { recipeSlug: "lime-bitters-spritz-avustralya-usulu", stepNumber: 2, before: "Buzu ekleyin.", after: "Bardağa bol buz koyup karışımı yavaşça buz üzerine dökün." },
  // 'Çayı/İçeceği soğutun' (2 hit)
  { recipeSlug: "kizilcikli-cay-serbeti-elazig-usulu", stepNumber: 1, before: "Çayı soğutun.", after: "Demlenmiş kızılcık çayını 20 dakika oda sıcaklığında soğumaya bırakın." },
  { recipeSlug: "leche-merengada-ispanya-usulu", stepNumber: 2, before: "İçeceği soğutun.", after: "İçeceği buzdolabında en az 30 dakika soğutup pürüzsüz kıvama getirin." },
  // 'X doğrayın' (3 hit)
  { recipeSlug: "armutlu-zencefil-smoothie", stepNumber: 1, before: "Armudu doğrayın.", after: "Olgun armudu soyup çekirdek evini çıkarın, küçük küpler halinde doğrayın." },
  { recipeSlug: "ananasli-hindistan-cevizi-smoothie", stepNumber: 1, before: "Ananası doğrayın.", after: "Olgun ananası soyup orta küpler halinde doğrayın, lifli orta sap kısmını çıkarın." },
  // 'Y ekleyin' (5 hit, context spesifik)
  { recipeSlug: "peynirli-manyok-kase-brezilya-usulu", stepNumber: 2, before: "Peyniri ekleyin.", after: "Beyaz peyniri orta küp doğrayıp manyok karışımına ekleyin." },
  { recipeSlug: "elderflower-elma-fizz-ingiltere-usulu", stepNumber: 2, before: "Sıvıları ekleyin.", after: "Mürver şurubu, elma suyu ve limon suyunu shaker'a alın." },
  { recipeSlug: "erzsebet-sour-macar-usulu", stepNumber: 2, before: "Sıvıları ekleyin.", after: "Vermut, limon suyu ve şurubu shaker'a alıp 10 saniye çalkalayın." },
  { recipeSlug: "zencefilli-limon-squash-avustralya-usulu", stepNumber: 2, before: "Zencefili ekleyin.", after: "Taze zencefili rendeleyip karışıma katın, 5 dakika dinlendirin." },
  { recipeSlug: "bergamotlu-soguk-cay-adana-usulu", stepNumber: 2, before: "Aromaları ekleyin.", after: "Bergamot kabuğu rendesi ve karanfili karışıma ekleyip dengeli karıştırın." },
  // 'Soğanı kavurun' (1)
  { recipeSlug: "kestaneli-hamsi-pilavi-zonguldak-usulu", stepNumber: 1, before: "Soğanı kavurun.", after: "Soğanı orta ateşte 4-5 dakika hafif renk alana kadar tereyağında çevirin." },
  // 'Cevizi iri dövün' (1)
  { recipeSlug: "karabuk-cevizli-kesli-yayim", stepNumber: 4, before: "Cevizi iri dövün.", after: "Cevizi havanda iri parçalar halinde dövün, toz olmasın." },
  // '20 saniye çekin' (1)
  { recipeSlug: "limonana", stepNumber: 2, before: "20 saniye çekin.", after: "Blender'da 20 saniye yüksek hızda çekerek pürüzsüz nane karışımı elde edin." },
  // '30 dakika soğutun' (1)
  { recipeSlug: "tahinli-incir-muhallebisi-adana-usulu", stepNumber: 5, before: "30 dakika soğutun.", after: "Muhallebiyi buzdolabında 30 dakika soğutup yüzeyini sertleştirin." },
];

async function main(): Promise<void> {
  await assertDbTarget("fix-step-too-short");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  let updated = 0;
  let skipped = 0;

  for (const fix of FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.recipeSlug },
      select: { id: true, steps: { select: { id: true, stepNumber: true, instruction: true } } },
    });
    if (!recipe) {
      console.log(`[skip] ${fix.recipeSlug}: not found`);
      skipped++;
      continue;
    }
    const step = recipe.steps.find((s) => s.stepNumber === fix.stepNumber);
    if (!step) {
      console.log(`[skip] ${fix.recipeSlug} step ${fix.stepNumber}: not found`);
      skipped++;
      continue;
    }
    if (step.instruction === fix.after) {
      console.log(`[skip] ${fix.recipeSlug} step ${fix.stepNumber}: zaten expand`);
      skipped++;
      continue;
    }
    if (step.instruction.trim() !== fix.before.trim()) {
      console.log(`[warn] ${fix.recipeSlug} step ${fix.stepNumber}: before mismatch`);
      console.log(`       expected: ${fix.before}`);
      console.log(`       actual  : ${step.instruction}`);
      skipped++;
      continue;
    }
    if (!APPLY) {
      console.log(`[plan] ${fix.recipeSlug} step ${fix.stepNumber}: '${fix.before}' → '${fix.after.slice(0, 60)}...'`);
      continue;
    }
    await prisma.recipeStep.update({ where: { id: step.id }, data: { instruction: fix.after } });
    await prisma.auditLog.create({
      data: {
        action: "STEP_REWRITE",
        targetType: "RecipeStep",
        targetId: step.id,
        metadata: {
          recipeSlug: fix.recipeSlug,
          stepNumber: fix.stepNumber,
          before: fix.before,
          after: fix.after,
          reason: "audit-content STEP_TOO_SHORT manuel expand",
        },
      },
    });
    console.log(`[ok] ${fix.recipeSlug} step ${fix.stepNumber}`);
    updated++;
  }

  console.log(`\nSUMMARY: updated=${updated}, skipped=${skipped}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
