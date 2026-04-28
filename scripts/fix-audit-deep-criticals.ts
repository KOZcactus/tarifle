/**
 * audit-deep CRITICAL paketi (oturum 32):
 *   - RECIPE_CONSISTENCY 36: vegan tag + hayvansal allergen (oturum 31 allergen
 *     retrofit'inde TIBBİ allergen eklendi, vegan tag temizlenmedi). Fix: vegan
 *     tag kaldır + DENIZ_URUNLERI yoksa vejetaryen ekle (yoksa).
 *   - ALLERGEN_ACCURACY 21: gerçek eksik allergen (Tereyağı→SUT, Zahter→SUSAM,
 *     Antep fıstığı→KUSUYEMIS, Tonkatsu sosu→SOYA, vb.). 5 false positive SKIP
 *     edildi (pirinç krakeri, Meksika kekiği baharatı, "tereyağı yerine" yağ).
 *
 * Hem seed-recipes.ts'i in-place edit eder hem DB'ye yazar (dev veya prod env).
 * Seed dosya: allergen-source-guard pre-push hook'u memnun.
 * DB: production data güncel.
 * AuditLog: kayıt için.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { assertDbTarget } from "./lib/db-env";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local") });

// 36 vegan tag fix slug listesi (RECIPE_CONSISTENCY CRITICAL)
const VEGAN_FIX: { slug: string; allergens: Allergen[] }[] = [
  { slug: "incirli-kekikli-semizotu-salatasi-aydin-usulu", allergens: ["SUT"] },
  { slug: "toronto-akcaagacli-yulaf-bar", allergens: ["YUMURTA", "SUT"] },
  { slug: "karalahana-diblesi-giresun-usulu", allergens: ["SUT"] },
  { slug: "tandir-otlu-gozleme-sirnak-usulu", allergens: ["SUT"] },
  { slug: "sebzeli-tarhonya-pilavi-macaristan-usulu", allergens: ["YUMURTA"] },
  { slug: "ordu-pancar-corbasi", allergens: ["SUT"] },
  { slug: "otlu-bademli-roka-salata-mugla-usulu", allergens: ["SUT"] },
  { slug: "kiraz-yaprakli-kofte-malatya-usulu", allergens: ["SUT", "YUMURTA"] },
  { slug: "patatesli-gendime-pilavi-malatya-usulu", allergens: ["SUT"] },
  { slug: "msemen", allergens: ["SUT"] },
  { slug: "moong-dal-chilla", allergens: ["SUT"] },
  { slug: "tursulu-kavrulmus-lahana-rize-usulu", allergens: ["SUT", "YUMURTA"] },
  { slug: "taflan-tursulu-patates-tava-ordu-usulu", allergens: ["SUT"] },
  { slug: "addis-ababa-shiro-wat-nohutlu", allergens: ["SUT"] },
  { slug: "koruklu-mercimek-piyazi-izmir-usulu", allergens: ["YUMURTA"] },
  { slug: "susamli-koz-biber-ezme-adana-usulu", allergens: ["SUT"] },
  { slug: "salcali-yarma-corbasi-batman-usulu", allergens: ["SUT"] },
  { slug: "sumakli-nohut-corbasi-mardin-usulu", allergens: ["SUT"] },
  { slug: "balkabakli-hindistancevizli-corba-avustralya-usulu", allergens: ["SUT"] },
  { slug: "tahinli-susamli-corek-manisa-usulu", allergens: ["YUMURTA"] },
  { slug: "tacu-tacu-sebzeli-peru-usulu", allergens: ["YUMURTA"] },
  { slug: "tahinli-isotlu-kabak-dip-adiyaman-usulu", allergens: ["SUT"] },
  { slug: "nohutlu-firikli-semsek-gaziantep-usulu", allergens: ["YUMURTA"] },
  { slug: "tahin-pekmez-bazlama-tostu-konya-usulu", allergens: ["SUT"] },
  { slug: "kiraz-yaprakli-sarma-malatya-usulu", allergens: ["SUT", "YUMURTA"] },
  { slug: "tutlu-yarma-corbasi-erzincan-usulu", allergens: ["SUT"] },
  { slug: "mangolu-pirinc-kremasi-kup-tayland-usulu", allergens: ["SUT"] },
  { slug: "tahinli-kapya-biber-dip-urla-usulu", allergens: ["SUT"] },
  { slug: "tahin-pekmezli-nevzine-kup-kayseri-usulu", allergens: ["SUT"] },
  { slug: "jokai-bableves", allergens: ["SUT", "YUMURTA"] },
  { slug: "kabak-bastisi-gaziantep-usulu", allergens: ["SUT"] },
  { slug: "otlu-pirinc-eristesi-salata-vietnam-usulu", allergens: ["DENIZ_URUNLERI"] },
  { slug: "maydanozlu-fasulye-piyazi-sinop-usulu", allergens: ["YUMURTA"] },
  { slug: "hindistancevizli-havuc-corbasi-vietnam-usulu", allergens: ["SUT"] },
  { slug: "salcali-madimakli-bulgur-pilavi-sivas-usulu", allergens: ["SUT"] },
  { slug: "hindistancevizli-pirinc-tatlisi-kuba-usulu", allergens: ["SUT"] },
  { slug: "tahinli-soganlama-kayseri-usulu", allergens: ["SUT"] },
  // Prod-extra (round 2 audit revealed):
  { slug: "nohutlu-bulgur-kapama-ankara-usulu", allergens: ["SUT"] },
  { slug: "koz-karnabahar-salatasi", allergens: ["SUT"] },
  { slug: "kinoa-pancar-bowl-avustralya-usulu", allergens: ["SUT"] },
  { slug: "kekikli-taze-badem-salatasi-antalya-usulu", allergens: ["SUT"] },
  { slug: "mersin-humuslu-sikma", allergens: ["YUMURTA"] },
  { slug: "hardaliyeli-kabak-salatasi-tekirdag-usulu", allergens: ["SUT"] },
  { slug: "mechouia-salatasi", allergens: ["YUMURTA"] },
  { slug: "nohutlu-kuru-bamya-yahnisi-konya-usulu", allergens: ["SUT"] },
  { slug: "kabak-cicegi-salatasi-mugla-usulu", allergens: ["SUT"] },
  { slug: "ordu-findikli-fasulye-kavurmasi", allergens: ["SUT"] },
  { slug: "oatcake-mushroom-stack-ingiliz-usulu", allergens: ["YUMURTA"] },
  { slug: "nar-eksili-sehriye-pilavi-mardin-usulu", allergens: ["SUT"] },
  { slug: "goi-xoai-vietnam-usulu", allergens: ["DENIZ_URUNLERI"] },
  { slug: "nom-hoa-chuoi", allergens: ["DENIZ_URUNLERI"] },
  { slug: "pide-ekmegi", allergens: ["SUT"] },
  { slug: "nar-eksili-kuru-patlican-ezmesi-mardin-usulu", allergens: ["SUT"] },
  { slug: "nohutlu-pancar-bulguru-ankara-usulu", allergens: ["SUT"] },
  { slug: "revithokeftedes", allergens: ["YUMURTA"] },
  { slug: "hardalli-elma-havuc-salatasi-tekirdag-usulu", allergens: ["SUT"] },
  { slug: "muzlu-kakaolu-tahin-kup-alanya-usulu", allergens: ["SUT"] },
];

// 21 allergen ekleme (ALLERGEN_ACCURACY CRITICAL gerçek)
const ALLERGEN_ADDS: { slug: string; allergen: Allergen }[] = [
  { slug: "zahter-salatasi-hatay-usulu", allergen: "SUSAM" },
  { slug: "menengic-kahvesi", allergen: "KUSUYEMIS" },
  { slug: "katsu-sando", allergen: "SOYA" },
  { slug: "tahinli-soganlama-kayseri-usulu", allergen: "SUT" },
  { slug: "sumakli-yumurta-kapama-kilis-usulu", allergen: "SUT" },
  { slug: "lorlu-zahter-salatasi-kilis-usulu", allergen: "SUSAM" },
  { slug: "sakizli-kavun-kasesi-cesme-usulu", allergen: "KUSUYEMIS" },
  { slug: "avokadolu-kakao-smoothie", allergen: "GLUTEN" },
  { slug: "sakizli-lor-tatlisi-izmir-usulu", allergen: "KUSUYEMIS" },
  { slug: "cevizli-zahter-salatasi-hatay-usulu", allergen: "SUSAM" },
  { slug: "mafis-tatlisi-balikesir-usulu", allergen: "KUSUYEMIS" },
  { slug: "sazerac", allergen: "GLUTEN" },
  { slug: "tavuklu-yesil-mercimek-pilavi-yozgat-usulu", allergen: "SUT" },
  { slug: "sumakli-soganli-tavuk-tepsi-orta-dogu-usulu", allergen: "KUSUYEMIS" },
  { slug: "tavuklu-bulgurlu-nohut-pilavi-siirt-usulu", allergen: "SUT" },
  { slug: "tavuklu-mantarli-kesme-makarna-zonguldak-usulu", allergen: "SUT" },
  { slug: "turos-barack-kup-macar-usulu", allergen: "GLUTEN" },
  { slug: "mugla-sundirme", allergen: "SUT" },
  { slug: "nar-eksili-cokelek-salatasi-hatay-usulu", allergen: "SUSAM" },
  { slug: "zeytinli-labneli-kahvalti-ekmegi-fas-usulu", allergen: "SUSAM" },
  { slug: "hatay-zahterli-tepsi-koftesi", allergen: "SUSAM" },
  // Prod-extra (round 2 audit revealed):
  { slug: "diyarbakir-mumbar-dolmasi", allergen: "SUT" },
  { slug: "balikesir-hosmerim-peynir-tatlisi", allergen: "KUSUYEMIS" },
  { slug: "bangkok-pad-see-ew", allergen: "DENIZ_URUNLERI" },
  { slug: "london-fish-and-chips", allergen: "SUT" },
  { slug: "rize-pepecura-uzum-tatlisi", allergen: "GLUTEN" },
  // Round 3 (allergen-matching rafine sonrası kalan gerçek):
  { slug: "kete-kirigi-tava-ardahan-usulu", allergen: "YUMURTA" },
  // Round 4 (source-DB sync sonrası: yeni ingredient'lar allergen tetikledi):
  { slug: "tahinli-soganlama-kayseri-usulu", allergen: "KUSUYEMIS" },
  { slug: "sumakli-soganli-tavuk-tepsi-orta-dogu-usulu", allergen: "GLUTEN" },
];

const SOURCE = path.resolve("scripts/seed-recipes.ts");

function patchSource(): { veganLines: number; allergenLines: number } {
  let content = fs.readFileSync(SOURCE, "utf-8");
  let veganLines = 0;
  let allergenLines = 0;

  // 1) Vegan tag fix: tags array içinde "vegan" kaldır, gerekirse "vejetaryen" ekle
  for (const item of VEGAN_FIX) {
    const slugMarker = `slug: "${item.slug}"`;
    const lineIdx = content.indexOf(slugMarker);
    if (lineIdx === -1) {
      console.warn(`  ⚠ source slug not found: ${item.slug}`);
      continue;
    }
    // Find the line containing this slug
    const lineStart = content.lastIndexOf("\n", lineIdx) + 1;
    const lineEnd = content.indexOf("\n", lineIdx);
    const line = content.slice(lineStart, lineEnd);

    // Replace tags array
    const tagMatch = line.match(/tags:\s*\[([^\]]*)\]/);
    if (!tagMatch) continue;
    const tagsStr = tagMatch[1];
    const tags = tagsStr.split(",").map((t) => t.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (!tags.includes("vegan")) continue;
    const newTags = tags.filter((t) => t !== "vegan");
    const isVegetarian = !item.allergens.includes("DENIZ_URUNLERI");
    if (isVegetarian && !newTags.includes("vejetaryen")) newTags.push("vejetaryen");
    const newTagsStr = newTags.map((t) => `"${t}"`).join(", ");
    const newLine = line.replace(tagMatch[0], `tags: [${newTagsStr}]`);
    content = content.slice(0, lineStart) + newLine + content.slice(lineEnd);
    veganLines++;
  }

  // 2) Allergen ekleme: allergens array sonuna ekle (yoksa)
  for (const item of ALLERGEN_ADDS) {
    const slugMarker = `slug: "${item.slug}"`;
    const lineIdx = content.indexOf(slugMarker);
    if (lineIdx === -1) {
      console.warn(`  ⚠ source slug not found: ${item.slug}`);
      continue;
    }
    const lineStart = content.lastIndexOf("\n", lineIdx) + 1;
    const lineEnd = content.indexOf("\n", lineIdx);
    const line = content.slice(lineStart, lineEnd);
    const allergenMatch = line.match(/allergens:\s*\[([^\]]*)\]/);
    if (!allergenMatch) continue;
    const allergensStr = allergenMatch[1];
    const existing = allergensStr.split(",").map((a) => a.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (existing.includes(item.allergen)) continue;
    existing.push(item.allergen);
    const newAllergensStr = existing.map((a) => `"${a}"`).join(", ");
    const newLine = line.replace(allergenMatch[0], `allergens: [${newAllergensStr}]`);
    content = content.slice(0, lineStart) + newLine + content.slice(lineEnd);
    allergenLines++;
  }

  fs.writeFileSync(SOURCE, content);
  return { veganLines, allergenLines };
}

async function patchDb(prisma: PrismaClient): Promise<{ veganDb: number; allergenDb: number }> {
  let veganDb = 0;
  let allergenDb = 0;

  const veganTag = await prisma.tag.findUnique({ where: { slug: "vegan" } });
  const vegTag = await prisma.tag.findUnique({ where: { slug: "vejetaryen" } });
  if (!veganTag) throw new Error("vegan tag not found in db");
  if (!vegTag) throw new Error("vejetaryen tag not found in db");

  for (const item of VEGAN_FIX) {
    const r = await prisma.recipe.findUnique({
      where: { slug: item.slug },
      select: { id: true, allergens: true, tags: { select: { tagId: true, tag: { select: { slug: true } } } } },
    });
    if (!r) {
      console.warn(`  ⚠ db slug not found: ${item.slug}`);
      continue;
    }
    const tagSlugs = r.tags.map((t) => t.tag.slug);
    const hasVegan = tagSlugs.includes("vegan");
    if (!hasVegan) continue;
    // Delete vegan link
    await prisma.recipeTag.deleteMany({ where: { recipeId: r.id, tagId: veganTag.id } });
    // Add vejetaryen link if no DENIZ_URUNLERI and not already present
    const isVegetarian = !r.allergens.includes("DENIZ_URUNLERI" as Allergen);
    const hasVeg = tagSlugs.includes("vejetaryen");
    if (isVegetarian && !hasVeg) {
      await prisma.recipeTag.create({ data: { recipeId: r.id, tagId: vegTag.id } });
    }
    await prisma.auditLog.create({
      data: {
        action: "VEGAN_TAG_FIX",
        targetType: "Recipe",
        targetId: r.id,
        metadata: {
          before: tagSlugs,
          after: tagSlugs.filter((t) => t !== "vegan").concat(isVegetarian && !hasVeg ? ["vejetaryen"] : []),
          reason: "audit-deep RECIPE_CONSISTENCY: vegan tag + animal allergen",
        },
      },
    });
    veganDb++;
  }

  for (const item of ALLERGEN_ADDS) {
    const r = await prisma.recipe.findUnique({ where: { slug: item.slug }, select: { id: true, allergens: true } });
    if (!r) {
      console.warn(`  ⚠ db slug not found: ${item.slug}`);
      continue;
    }
    if (r.allergens.includes(item.allergen)) continue;
    const newAllergens = [...r.allergens, item.allergen];
    await prisma.recipe.update({ where: { id: r.id }, data: { allergens: newAllergens } });
    await prisma.auditLog.create({
      data: {
        action: "ALLERGEN_ADD",
        targetType: "Recipe",
        targetId: r.id,
        metadata: { before: r.allergens, after: newAllergens, reason: `audit-deep ALLERGEN_ACCURACY: missing ${item.allergen}` },
      },
    });
    allergenDb++;
  }

  return { veganDb, allergenDb };
}

async function main() {
  const target = assertDbTarget("fix-audit-deep-criticals");
  console.log(`📂 Source patching: scripts/seed-recipes.ts`);
  const { veganLines, allergenLines } = patchSource();
  console.log(`   vegan tag fix in source: ${veganLines}/${VEGAN_FIX.length}`);
  console.log(`   allergen add in source:  ${allergenLines}/${ALLERGEN_ADDS.length}`);
  console.log();
  console.log(`💾 DB patching: ${target.host}`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
  const { veganDb, allergenDb } = await patchDb(prisma);
  console.log(`   vegan tag fix in db:     ${veganDb}/${VEGAN_FIX.length}`);
  console.log(`   allergen add in db:      ${allergenDb}/${ALLERGEN_ADDS.length}`);
  await prisma.$disconnect();
  console.log("\n🎉 fix done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
