/**
 * audit-tipnote-coverage 71 boilerplate temizlik (oturum 34).
 * Adı yanıltıcı: aslında servingSuggestion alanında boilerplate var
 * (tipNote DEĞİL), 13 boilerplate group, 71 hit toplam.
 *
 * Top 5 group (31 hit) tarif tipine + slug hash'ine göre özgün cümle
 * bankasından rotate. Her tarif unique-feel + boilerplate kırılır.
 *
 * Top boilerplate'ler:
 *   7x: "Taze doğranmış dereotu ve bir damla zeytinyağıyla sunum kurun..."
 *   6x: "Yüksek ince bardakta buzla birlikte verin..."
 *   6x: "Üstüne bir parça fıstık tozu veya ince tarçın gezdirip..."
 *   6x: "Taze limon ve roka ile soğumadan masaya götürün..."
 *   6x: "Soğuk içecek için 1 saat önceden bardakları buzdolabında..."
 *
 * Kalan 5x grupları (40 hit) kabul edilebilir advisory, defer.
 *
 * AuditLog action SERVING_REWRITE.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const APPLY = process.argv.includes("--apply");
const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

// Boilerplate cümleler (tam eşleşme)
const BOILERPLATES = [
  "Taze doğranmış dereotu ve bir damla zeytinyağıyla sunum kurun, yanına kıtır ekmek iliştirin.",
  "Yüksek ince bardakta buzla birlikte verin, bardağın kenarını limon kabuğuyla gezdirip süsleyin.",
  "Üstüne bir parça fıstık tozu veya ince tarçın gezdirip porselen tabakta servis yapın.",
  "Taze limon ve roka ile soğumadan masaya götürün, yanına ılık patates eşlik etsin.",
  "Soğuk içecek için 1 saat önceden bardakları buzdolabında bekletin; sıcak camda aroma zayıflar.",
];

// Tarif tipine göre özgün cümle bankası (her tip 5-6 varyasyon)
const ALTERNATIVES: Record<string, string[]> = {
  YEMEK: [
    "Sıcak servis tabağına alın, yanına taze yeşillik salatası ve ılık ekmekle birlikte sunun.",
    "Geniş porselen tabakta, üstüne bir tutam taze maydanoz serperek dumanı tüter sıcaklıkta servis edin.",
    "Yanına sade pilav veya buharlı bulgurla, kenarda turşu ve cacık ile zenginleştirin.",
    "Servis öncesi 5 dakika dinlendirin, üzerine sızma zeytinyağı gezdirip yanına limon dilimi koyun.",
    "Geniş kase ya da derin tabakta sunun; üstünü acı pul biber ve nane yaprağıyla bitirin.",
  ],
  CORBA: [
    "Servis kasesine boşaltıp üzerine kızdırılmış tereyağı ve nane gezdirin, yanına ekmek koyun.",
    "Sıcak kaselerde, üstüne taze maydanoz ve bir damla limon suyuyla servis edin.",
    "Derin kasede, üstüne kıyılmış nane ve birkaç damla zeytinyağıyla sunun.",
    "Servis öncesi yumurta sarısı + limonla terbiye etmek isterseniz çorbayı ocaktan alıp yavaşça katın.",
    "Yanına çıtır ekmek ve dilimlenmiş limon ile birlikte sıcak masaya çıkarın.",
  ],
  ICECEK: [
    "Yüksek bardakta bol buzla, ince dilimlenmiş limon veya nane yaprağıyla soğuk servis edin.",
    "Soğutulmuş bardakta, üstüne taze nane veya meyve dilimi yerleştirip taze hazırlanmış halde sunun.",
    "Buzlu bardağa dökün, yanına kısa karıştırma çubuğu ve bir limon dilimi iliştirin.",
    "Servis öncesi bardağı 10 dakika buzlukta soğutun, içeceği aroması taze haldeyken hemen dökün.",
    "Geniş bardakta, üstüne taze meyve veya kabuk rendesi serperek 1-2 dakika içinde servis edin.",
  ],
  KOKTEYL: [
    "Soğutulmuş kadehte, kenarına narenciye kabuğu sürerek aromayı taze tutun.",
    "Buz dolu shaker'da çalkaladıktan sonra süzerek yüksek bardakta sunun, üstüne kabuk rendesi düşürün.",
    "Yüksek bardakta bol buzla, kenarına yağmurlanmış meyve veya ot iliştirip serinde sunun.",
    "Önceden soğutulmuş kadehte, son anda hazırlayıp aroması canlı haldeyken servis edin.",
    "Geniş kadeh veya highball'da bol buzla, yanında küçük bir karıştırma çubuğu ile sunun.",
  ],
  KAHVALTI: [
    "Yanına dilimlenmiş ekmek, taze yeşillik ve bardak çayla sıcak masaya çıkarın.",
    "Geniş kahvaltı tabağında, kenarda zeytin ve peynir eşliğinde sunun.",
    "Üstüne bir kaşık tereyağı koyup açık ekmek dilimleriyle yanında servis edin.",
    "Sıcak haliyle ekmek arasına, yanında turşu ve sade çayla tamamlayın.",
    "Tabakta beyaz peynir, zeytin ve domates dilimleriyle birlikte kahvaltı sofrasına koyun.",
  ],
  TATLI: [
    "Servis tabağına alıp 30 dakika buzdolabında dinlendirin, üstüne ince fıstık tozu serperek sunun.",
    "Soğuk porselen tabakta, üstüne bir tutam tarçın ve ince doğranmış ceviz gezdirin.",
    "Servis öncesi en az 1 saat soğutun, üstüne kaymak veya çırpılmış krema iliştirin.",
    "Geniş tabakta, kenara taze meyve dilimleri ve nane yaprağı koyup soğuk servis edin.",
    "Küçük servis kaselerinde, üstüne karamelli sos veya ince tarçın gezdirerek sunun.",
  ],
  SALATA: [
    "Servis tabağında, sos parlaklığını korurken yanına ılık ekmek dilimleriyle masaya götürün.",
    "Geniş kase veya tabakta, üstüne ince dilimlenmiş limon ve maydanoz yapraklarıyla sunun.",
    "Servis öncesi 5 dakika dinlendirip yan kaplarında turşu ve zeytin yerleştirin.",
    "Soğuk tabakta, üstüne kabuk rendesi veya çıtır ekmek parçacıkları serperek tamamlayın.",
    "Yanına kıtır ekmek, dilimli limon ve bir kase zeytin koyarak çeşitlendirilmiş sunum kurun.",
  ],
  APERATIF: [
    "Servis tahtasında, yanına dilimlenmiş baget veya kraker, küçük kaselerde turşu ve zeytin yerleştirin.",
    "Geniş tabakta, üstüne taze ot ve birkaç damla zeytinyağı gezdirip yanında ekmek dilimi sunun.",
    "Soğuk veya ılık halinde, küçük porsiyonlarda kürdan veya kraker yanında servis edin.",
    "Tepside, kenarda dilimli limon ve maydanoz yaprağıyla, ortada birden fazla aperitif çeşidi sunun.",
    "Küçük servis tabaklarında, ısı dengesi için 2-3 dakika oda sıcaklığında dinlendirip masaya alın.",
  ],
  ATISTIRMALIK: [
    "Geniş tabakta, kenara turşu ve dilimli salatalık koyarak ılık veya oda sıcaklığında sunun.",
    "Servis tahtasına alıp yanına yoğurtlu sos veya cacık eşliğinde sunum yapın.",
    "Çıtır halinde, üstüne çeşni baharat ve birkaç tutam taze ot serperek küçük tabaklarda dağıtın.",
    "Servis öncesi 1-2 dakika dinlendirip kıtır kaldığında küçük kürdanlarla yanında sos sunun.",
    "Geniş kasede, üstüne sızma zeytinyağı veya turşu suyu gezdirip ekmekle birlikte ikram edin.",
  ],
  SOS: [
    "Küçük servis kasesinde, üstüne birkaç damla zeytinyağı veya çiçeği gezdirip yanına kraker iliştirin.",
    "Soğuk kasede, üstüne kıyılmış maydanoz veya kabuk rendesi serperek dipping olarak sunun.",
    "Servis kasesi kenarına ince ekmek dilimleri yerleştirip ortada sosu süslemeli sunun.",
    "Servisten 10 dakika önce buzdolabından çıkarın, üstüne taze ot ve birkaç damla limon ekleyin.",
    "Küçük kase veya çanakta, yanında dilimlenmiş sebze ve ekmek dilimleriyle bütünleştirin.",
  ],
};

// Slug hash → deterministik index seç (her tarif tutarlı varyasyon alsın)
function pickAlt(slug: string, options: string[]): string {
  const hash = createHash("md5").update(slug).digest("hex");
  const idx = parseInt(hash.slice(0, 8), 16) % options.length;
  return options[idx];
}

interface PlannedFix {
  recipeSlug: string;
  recipeType: string;
  before: string;
  after: string;
}

async function main(): Promise<void> {
  await assertDbTarget("fix-serving-boilerplate");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipes = await prisma.recipe.findMany({
    where: { servingSuggestion: { in: BOILERPLATES } },
    select: { id: true, slug: true, type: true, servingSuggestion: true },
  });
  console.log(`Total recipes with boilerplate: ${recipes.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const planned: PlannedFix[] = [];
  let unsupportedType = 0;

  for (const r of recipes) {
    const opts = ALTERNATIVES[r.type];
    if (!opts) {
      unsupportedType++;
      continue;
    }
    const newText = pickAlt(r.slug, opts);
    planned.push({
      recipeSlug: r.slug,
      recipeType: r.type,
      before: r.servingSuggestion ?? "",
      after: newText,
    });
  }

  console.log(`Planlı: ${planned.length} (unsupported type skip: ${unsupportedType})`);
  console.log(`Sample (ilk 5):`);
  for (const p of planned.slice(0, 5)) {
    console.log(`\n  [${p.recipeSlug}] ${p.recipeType}`);
    console.log(`  ÖNCE:  ${p.before.slice(0, 90)}`);
    console.log(`  SONRA: ${p.after.slice(0, 90)}`);
  }

  if (!APPLY) {
    console.log("\nDry-run. Apply için --apply.");
    await prisma.$disconnect();
    return;
  }

  let applied = 0;
  for (const p of planned) {
    const recipe = await prisma.recipe.findUnique({ where: { slug: p.recipeSlug }, select: { id: true } });
    if (!recipe) continue;
    await prisma.recipe.update({ where: { id: recipe.id }, data: { servingSuggestion: p.after } });
    await prisma.auditLog.create({
      data: {
        action: "SERVING_REWRITE",
        targetType: "Recipe",
        targetId: recipe.id,
        metadata: {
          recipeSlug: p.recipeSlug,
          recipeType: p.recipeType,
          before: p.before,
          after: p.after,
          reason: "audit-tipnote-coverage boilerplate, type-bazlı varyasyon rotate",
        },
      },
    });
    applied++;
  }
  console.log(`\nAPPLIED: ${applied} servingSuggestion rewrite`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
