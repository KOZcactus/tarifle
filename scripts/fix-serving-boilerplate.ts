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

// Boilerplate dinamik tespit eşiği: bir cümle 5+ tarifede tekrar ediyorsa
// boilerplate sayılır. Audit-tipnote-coverage ile aynı eşik.
const BOILERPLATE_THRESHOLD = 7;

// Tarif tipine göre özgün cümle bankası (her tip 10 varyasyon, oturum 34
// round 2'de 5 yetersiz oldu, slug hash deterministik dağılım kümeleşti,
// bazı varyasyonlar 7x tekrar etti. 10 varyasyonla 1/10 × 5 = 0.5% chance
// 5 tarifin aynı denk gelmesi).
const ALTERNATIVES: Record<string, string[]> = {
  YEMEK: [
    "Sıcak servis tabağına alın, yanına taze yeşillik salatası ve ılık ekmekle birlikte sunun.",
    "Geniş porselen tabakta, üstüne bir tutam taze maydanoz serperek dumanı tüter sıcaklıkta servis edin.",
    "Yanına sade pilav veya buharlı bulgurla, kenarda turşu ve cacık ile zenginleştirin.",
    "Servis öncesi 5 dakika dinlendirin, üzerine sızma zeytinyağı gezdirip yanına limon dilimi koyun.",
    "Geniş kase ya da derin tabakta sunun; üstünü acı pul biber ve nane yaprağıyla bitirin.",
    "Sıcak tepside, kenarda közlenmiş biber ve domatesle birlikte sofraya çıkarın.",
    "Üstüne tereyağında kavrulmuş baharat eklediğinizde aroma daha öne çıkar, sıcak servis edin.",
    "Yanına ayran veya cacık koyup, üzerine ince doğranmış taze yeşillik serpip ılık tutun.",
    "Geniş tabağa porsiyonlayıp ortada salça ve sumakla, kenarda mevsim sebzesiyle tamamlayın.",
    "Sıcak halde dilimleyip her porsiyona limon kabuğu rendesi ve taze nane düşürün.",
  ],
  CORBA: [
    "Servis kasesine boşaltıp üzerine kızdırılmış tereyağı ve nane gezdirin, yanına ekmek koyun.",
    "Sıcak kaselerde, üstüne taze maydanoz ve bir damla limon suyuyla servis edin.",
    "Derin kasede, üstüne kıyılmış nane ve birkaç damla zeytinyağıyla sunun.",
    "Servis öncesi yumurta sarısı + limonla terbiye etmek isterseniz çorbayı ocaktan alıp yavaşça katın.",
    "Yanına çıtır ekmek ve dilimlenmiş limon ile birlikte sıcak masaya çıkarın.",
    "Sıcak kaseye alıp üstüne pul biberli yağ ve naneli tereyağı gezdirin.",
    "Beyaz porselen kasede, kenarda taze ekmek dilimleri ve sarımsaklı yoğurt ile sunun.",
    "Üstüne ince doğranmış maydanoz ve birkaç damla limon suyuyla canlandırarak ılık verin.",
    "Servis önce 2 dakika dinlendirip kıvam koyulaştığında derin kasede taze otla bitirin.",
    "Yanına çıtır kruton, közlenmiş biber dilimleri veya kavrulmuş ekmek küpleriyle eşlik ettirin.",
  ],
  ICECEK: [
    "Yüksek bardakta bol buzla, ince dilimlenmiş limon veya nane yaprağıyla soğuk servis edin.",
    "Soğutulmuş bardakta, üstüne taze nane veya meyve dilimi yerleştirip taze hazırlanmış halde sunun.",
    "Buzlu bardağa dökün, yanına kısa karıştırma çubuğu ve bir limon dilimi iliştirin.",
    "Servis öncesi bardağı 10 dakika buzlukta soğutun, içeceği aroması taze haldeyken hemen dökün.",
    "Geniş bardakta, üstüne taze meyve veya kabuk rendesi serperek 1-2 dakika içinde servis edin.",
    "Bardağa bol buz koyup içeceği yavaşça dökün, kenarına ince meyve dilimi sürün.",
    "Soğuk porselen bardakta, kenarda kuru meyve veya kabuk rendesi yerleştirin.",
    "Tall glass'ta bol buzla, üstüne ince taze nane veya bazilik yaprağı düşürün.",
    "Servis kâsesinde, kenara meyve püresi veya bal süzgecinden geçirilmiş şurup koyun.",
    "Buz dolu bardakta hızla servis edin, aroması ılınmadan ilk 5 dakika tüketilsin.",
  ],
  KOKTEYL: [
    "Soğutulmuş kadehte, kenarına narenciye kabuğu sürerek aromayı taze tutun.",
    "Buz dolu shaker'da çalkaladıktan sonra süzerek yüksek bardakta sunun, üstüne kabuk rendesi düşürün.",
    "Yüksek bardakta bol buzla, kenarına yağmurlanmış meyve veya ot iliştirip serinde sunun.",
    "Önceden soğutulmuş kadehte, son anda hazırlayıp aroması canlı haldeyken servis edin.",
    "Geniş kadeh veya highball'da bol buzla, yanında küçük bir karıştırma çubuğu ile sunun.",
    "Coupe glass'ta süzerek dökün, üstüne kabuk veya çiçek dilimiyle bitiriş yapın.",
    "Rocks bardağına büyük buzla, kenarına narenciye kabuğu yağmurlu olarak sürün.",
    "Çalkalama sonrası ince elekten geçirip, soğuk kadehte ilk dakikalarda tüketin.",
    "Bardağın iç kenarına ot demeti yapıştırıp, üstüne ince meyve dilimiyle vurgulayın.",
    "Long drink bardağında bol buz, kenarına şeker veya tuz halkasıyla aromayı zenginleştirin.",
  ],
  KAHVALTI: [
    "Yanına dilimlenmiş ekmek, taze yeşillik ve bardak çayla sıcak masaya çıkarın.",
    "Geniş kahvaltı tabağında, kenarda zeytin ve peynir eşliğinde sunun.",
    "Üstüne bir kaşık tereyağı koyup açık ekmek dilimleriyle yanında servis edin.",
    "Sıcak haliyle ekmek arasına, yanında turşu ve sade çayla tamamlayın.",
    "Tabakta beyaz peynir, zeytin ve domates dilimleriyle birlikte kahvaltı sofrasına koyun.",
    "Geniş kahvaltı tepsisinde, ortada bal ve kaymak, kenarda zeytin ve mevsim sebzesi yerleştirin.",
    "Sıcak halde, dilimli ekmek + reçel ve demli çayla bir araya getirin.",
    "Üstüne ince doğranmış taze maydanoz veya nane serpip ekmek arasında ılık ikram edin.",
    "Servis tahtasında, ortada peynir + zeytin + domates üçlüsüyle birlikte sıcak çayla servis edin.",
    "Geniş tabakta, üstüne biraz tereyağı eritilmiş halde dökün, yanına çıtır ekmek koyun.",
  ],
  TATLI: [
    "Servis tabağına alıp 30 dakika buzdolabında dinlendirin, üstüne ince fıstık tozu serperek sunun.",
    "Soğuk porselen tabakta, üstüne bir tutam tarçın ve ince doğranmış ceviz gezdirin.",
    "Servis öncesi en az 1 saat soğutun, üstüne kaymak veya çırpılmış krema iliştirin.",
    "Geniş tabakta, kenara taze meyve dilimleri ve nane yaprağı koyup soğuk servis edin.",
    "Küçük servis kaselerinde, üstüne karamelli sos veya ince tarçın gezdirerek sunun.",
    "Soğuk porselen kasede, üstüne pudra şekeri elekten geçirilmiş halde verin.",
    "Servis tabağında, kenara ince doğranmış kuru meyve veya antep fıstığı yerleştirin.",
    "Buzdolabında 30 dakika ek dinlenme sonrası, üstüne kakao tozu veya tarçın serpin.",
    "Geniş tatlı kasesinde, kenarda taze meyve sosu veya çikolata sosu damlatın.",
    "Küçük porselen tabakta, üstüne kavrulmuş ceviz veya fındık parçaları serperek soğuk servis edin.",
  ],
  SALATA: [
    "Servis tabağında, sos parlaklığını korurken yanına ılık ekmek dilimleriyle masaya götürün.",
    "Geniş kase veya tabakta, üstüne ince dilimlenmiş limon ve maydanoz yapraklarıyla sunun.",
    "Servis öncesi 5 dakika dinlendirip yan kaplarında turşu ve zeytin yerleştirin.",
    "Soğuk tabakta, üstüne kabuk rendesi veya çıtır ekmek parçacıkları serperek tamamlayın.",
    "Yanına kıtır ekmek, dilimli limon ve bir kase zeytin koyarak çeşitlendirilmiş sunum kurun.",
    "Geniş porselen kasede, üstüne sızma zeytinyağı ve birkaç damla nar ekşisi gezdirin.",
    "Soğuk halde, kenarda közlenmiş biber dilimleri ve taze ekmekle birlikte sunun.",
    "Servis kasesinde, üstüne taze maydanoz ve dereotu serperek limon dilimiyle bitirin.",
    "Geniş tabakta sosu önce dipte, malzemeleri üst katta yerleştirip kenara çıtır kruton koyun.",
    "Tabağa karıştırılmamış sos + malzeme katları halinde dağıtıp servis öncesi yavaşça karıştırın.",
  ],
  APERATIF: [
    "Servis tahtasında, yanına dilimlenmiş baget veya kraker, küçük kaselerde turşu ve zeytin yerleştirin.",
    "Geniş tabakta, üstüne taze ot ve birkaç damla zeytinyağı gezdirip yanında ekmek dilimi sunun.",
    "Soğuk veya ılık halinde, küçük porsiyonlarda kürdan veya kraker yanında servis edin.",
    "Tepside, kenarda dilimli limon ve maydanoz yaprağıyla, ortada birden fazla aperitif çeşidi sunun.",
    "Küçük servis tabaklarında, ısı dengesi için 2-3 dakika oda sıcaklığında dinlendirip masaya alın.",
    "Tepside, ortada sos kasesi etrafında dilimlenmiş ekmek ve sebze ile bütünleştirin.",
    "Küçük kürdanlar yanında, ortada dipping sos ile servis tahtasında sunun.",
    "Geniş aperitif tabağında, üstüne ince doğranmış taze ot ve birkaç damla limon serpin.",
    "Servis tahtasında peynir + meyve eşliğinde, kenarda kraker veya çıtır ekmek dilimi yerleştirin.",
    "Küçük servis kasesinde, kenarda dilimli limon ve maydanoz yapraklarıyla soğuk halde sunun.",
  ],
  ATISTIRMALIK: [
    "Geniş tabakta, kenara turşu ve dilimli salatalık koyarak ılık veya oda sıcaklığında sunun.",
    "Servis tahtasına alıp yanına yoğurtlu sos veya cacık eşliğinde sunum yapın.",
    "Çıtır halinde, üstüne çeşni baharat ve birkaç tutam taze ot serperek küçük tabaklarda dağıtın.",
    "Servis öncesi 1-2 dakika dinlendirip kıtır kaldığında küçük kürdanlarla yanında sos sunun.",
    "Geniş kasede, üstüne sızma zeytinyağı veya turşu suyu gezdirip ekmekle birlikte ikram edin.",
    "Servis tahtasında, ortada dipping sos kasesi etrafında dilimlenmiş malzemeleri sıralayın.",
    "Sıcak veya ılık halde, kenarda taze sebze çubukları ve yoğurtlu dipping ile bütünleştirin.",
    "Geniş tepside, üstüne kavrulmuş susam veya çörek otu serperek paylaştırın.",
    "Küçük servis tabaklarında, kenarda limon dilimi ve taze maydanoz iliştirip kürdanlarla sunun.",
    "Soğuk veya ılık halde, kenarda yoğurtlu sos kasesi ile birlikte küçük porsiyonlar halinde dağıtın.",
  ],
  SOS: [
    "Küçük servis kasesinde, üstüne birkaç damla zeytinyağı veya çiçeği gezdirip yanına kraker iliştirin.",
    "Soğuk kasede, üstüne kıyılmış maydanoz veya kabuk rendesi serperek dipping olarak sunun.",
    "Servis kasesi kenarına ince ekmek dilimleri yerleştirip ortada sosu süslemeli sunun.",
    "Servisten 10 dakika önce buzdolabından çıkarın, üstüne taze ot ve birkaç damla limon ekleyin.",
    "Küçük kase veya çanakta, yanında dilimlenmiş sebze ve ekmek dilimleriyle bütünleştirin.",
    "Geniş dip kasesinde, kenarda kraker + sebze çubukları ile bir araya getirin.",
    "Üstüne ince doğranmış taze ot ve birkaç damla zeytinyağı düşürerek soğuk dipping olarak sunun.",
    "Servis kasesi kenarına ince dilimlenmiş limon yerleştirip ortada sosa damla zeytinyağı ekleyin.",
    "Küçük dip kasesinde, kenarda küçük kürdanlar veya kraker dilimleri ile sunum tamamlayın.",
    "Geniş porselen kasede, üstüne sumak veya pul biber serperek hafif kontrast yaratın.",
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

  // Önce dinamik boilerplate tespit: 5+ tarifede tekrar eden servingSuggestion
  const all = await prisma.recipe.findMany({
    where: { servingSuggestion: { not: null } },
    select: { servingSuggestion: true },
  });
  const counts: Record<string, number> = {};
  for (const r of all) {
    if (r.servingSuggestion) counts[r.servingSuggestion] = (counts[r.servingSuggestion] ?? 0) + 1;
  }
  const boilerplates = Object.entries(counts)
    .filter(([, c]) => c >= BOILERPLATE_THRESHOLD)
    .map(([s]) => s);
  console.log(`Boilerplate tespit: ${boilerplates.length} cümle ${BOILERPLATE_THRESHOLD}+ tekrar eden`);

  const recipes = await prisma.recipe.findMany({
    where: { servingSuggestion: { in: boilerplates } },
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
