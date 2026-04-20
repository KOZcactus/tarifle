/**
 * Fix boilerplate tipNote + servingSuggestion on 42 batch-7 recipes.
 *
 * Codex applied the same generic tipNote to all 42 recipes via .map():
 *   "Sosu ve ana malzemeyi ayrı hazırlayın; son aşamada birleştirince doku korunur."
 * This is factually wrong for most (e.g., tatlılar, one-pot yemekler).
 *
 * This script replaces each recipe's tipNote with either null (no sauce
 * component) or a recipe-specific tip (sauce/multi-component recipes).
 * Also replaces the generic servingSuggestion with recipe-specific ones.
 *
 * Run:
 *   npx tsx scripts/fix-boilerplate-tipnotes.ts --dry-run
 *   npx tsx scripts/fix-boilerplate-tipnotes.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

const BOILERPLATE_TIPNOTE =
  "Sosu ve ana malzemeyi ayrı hazırlayın; son aşamada birleştirince doku korunur.";
const BOILERPLATE_SERVING =
  "Sıcak servis edin ve yanında sade bir eşlikçi kullanın.";

// ─── Per-recipe fixes ───────────────────────────────────────
// Each entry: slug → { tipNote, servingSuggestion }
// null = field should be null in DB (no useful tip / generic serving is wrong)
// string = recipe-specific replacement

interface Fix {
  tipNote: string | null;
  servingSuggestion: string | null;
}

const FIXES: Record<string, Fix> = {
  // ── REWRITE (has sauce/multi-component) ──
  "general-tso-tavuk": {
    tipNote: "Tavuğu kızarttıktan sonra yağını süzün; sosla buluşturduğunuzda kaplama çıtır kalır, yumuşamaz.",
    servingSuggestion: "Buharda pişmiş pirinç ile servis edin.",
  },
  "beef-chow-fun": {
    tipNote: "Woku dumanlı kızgın yapın; erişteler tavaya yapışmadan tek seferde çevirirseniz isli wok aroması oluşur.",
    servingSuggestion: "Hemen servis edin; bekledikçe erişte yumuşar.",
  },
  "portokalopita": {
    tipNote: "Şerbet sıcak, tatlı fırından yeni çıkmışken dökülmeli; her iki taraf da sıcaksa hamur şerbeti hızlı emer.",
    servingSuggestion: "Oda sıcaklığında, üzerine pudra şekeri serperek servis edin.",
  },
  "ojja-merguez": {
    tipNote: "Yumurtaları kırdıktan sonra kapağı kapatıp düşük ateşte pişirin; akı donarken sarısı kremamsı kalır.",
    servingSuggestion: "Sıcak ekmek ile tabaktan yiyerek servis edin.",
  },
  "rfissa": {
    tipNote: "Ekmekleri servis tabağına dizin ve sosu hemen dökün; ekmek sosu çekince doku yumuşar, beklerse hamurlaşır.",
    servingSuggestion: "Sıcak olarak, mercimekle birlikte servis edin.",
  },
  "basbousa": {
    tipNote: "Şerbeti basbousa fırında sıcakken dökün; irmik soğukken dökülürse şerbeti emmez ve hamur kuru kalır.",
    servingSuggestion: "Oda sıcaklığında, her dilimin üzerine bir badem koyarak servis edin.",
  },
  "knafeh-cups": {
    tipNote: "Kadayıfı kalıpta sıkıca bastırın; gevşek bırakırsanız pişerken dağılır ve kup şeklini tutmaz.",
    servingSuggestion: "Fırından çıkar çıkmaz, sıcakken servis edin.",
  },
  "chiles-rellenos": {
    tipNote: "Közlenmiş biberlerin kabuğunu temizlerken yırtmayın; peynir dışarı akarsa kaplama tutmaz.",
    servingSuggestion: "Domates sosu ve ekşi krema ile servis edin.",
  },
  "carne-asada": {
    tipNote: "Eti ızgaradan aldıktan sonra 5 dakika dinlendirin; lifler gevşer ve suyunu kaybetmez.",
    servingSuggestion: "Tortilla, guacamole ve lime ile servis edin.",
  },
  "chicken-and-waffles": {
    tipNote: "Tavuğu kızarttıktan sonra ızgarada 2 dakika tutun; fazla yağ akar ve çıtırlık korunur.",
    servingSuggestion: "Akçaağaç şurubu ve tereyağı ile sıcak servis edin.",
  },
  "gaeng-daeng": {
    tipNote: "Köri ezmesini hindistan cevizi sütünden önce kuru kavurun; yağı çıkınca aroma katlanır.",
    servingSuggestion: "Jasmine pirinç ile servis edin.",
  },
  "yam-woon-sen": {
    tipNote: "Erişteyi süzdükten sonra soğuk suyla durulayın; yapışmaz ve salata soğuk kalır.",
    servingSuggestion: "Marul yaprakları üzerinde soğuk servis edin.",
  },
  "rogan-josh": {
    tipNote: "Yoğurdu tencereye oda sıcaklığında ve kaşık kaşık ekleyin; soğuk yoğurt topaklaşır.",
    servingSuggestion: "Basmati pirinç ve naan ekmek ile servis edin.",
  },
  "salade-lyonnaise": {
    tipNote: "Yumurtayı poşe pişirirken suya 1 yemek kaşığı sirke ekleyin; ak dağılmadan toplanır.",
    servingSuggestion: "Ilık olarak, sosu üzerine gezdirerek servis edin.",
  },
  "albondigas": {
    tipNote: "Köfteleri sosa atmadan önce tavada her yüzünü mühürleyin; mühürleme kıvamı tutar, köfte sostan dağılmaz.",
    servingSuggestion: "Kızarmış ekmek dilimleriyle servis edin.",
  },
  "bursa-pideli-kofte": {
    tipNote: "Pideyi servis tabağında ince kesin, üzerine sos dökün, en son kızgın tereyağı gezdirin; tereyağı soğursa aroma düşer.",
    servingSuggestion: "Yanında yoğurt ve közlenmiş biber ile servis edin.",
  },
  "edirne-cigeri": {
    tipNote: "Ciğeri bıçak sırtı kalınlığında doğrayın; kalın kesilirse içi sertleşir, ince kesilirse çıtır olur.",
    servingSuggestion: "Kızarmış sivri biberler ile servis edin.",
  },

  // ── NULL (no sauce component, boilerplate is wrong) ──
  "tea-egg": {
    tipNote: null,
    servingSuggestion: "Soğuk veya oda sıcaklığında, atıştırmalık olarak servis edin.",
  },
  "sesame-balls": {
    tipNote: null,
    servingSuggestion: "Sıcakken, çay eşliğinde servis edin.",
  },
  "saganaki": {
    tipNote: null,
    servingSuggestion: "Kızgınken limon sıkarak hemen servis edin.",
  },
  "fasolada": {
    tipNote: null,
    servingSuggestion: "Zeytinyağı gezdirip ekmek ile servis edin.",
  },
  "revithokeftedes": {
    tipNote: null,
    servingSuggestion: "Tahin sos ve limon ile servis edin.",
  },
  "slata-mechouia": {
    tipNote: null,
    servingSuggestion: "Ekmek ve zeytinyağı ile meze olarak servis edin.",
  },
  "msemen": {
    tipNote: null,
    servingSuggestion: "Bal ve tereyağı ile sıcak servis edin.",
  },
  "ful-medames": {
    tipNote: null,
    servingSuggestion: "Zeytinyağı, limon ve pita ekmek ile servis edin.",
  },
  "sopa-de-fideo": {
    tipNote: null,
    servingSuggestion: "Lime ve taze kişniş ile sıcak servis edin.",
  },
  "corn-dog": {
    tipNote: null,
    servingSuggestion: "Hardal ve ketçap ile sıcak servis edin.",
  },
  "khanom-krok": {
    tipNote: null,
    servingSuggestion: "Taze hindistan cevizi parçalarıyla sıcak servis edin.",
  },
  "tod-mun-pla": {
    tipNote: null,
    servingSuggestion: "Tatlı acı biber sosu ile servis edin.",
  },
  "kai-jeow": {
    tipNote: null,
    servingSuggestion: "Buharda pirinç ve biber sosu ile servis edin.",
  },
  "aloo-gobi": {
    tipNote: null,
    servingSuggestion: "Naan ekmek veya pirinç ile servis edin.",
  },
  "chana-masala": {
    tipNote: null,
    servingSuggestion: "Basmati pirinç ve raita ile servis edin.",
  },
  "kheer": {
    tipNote: null,
    servingSuggestion: "Soğuk veya ılık, üzerine antep fıstığı serperek servis edin.",
  },
  "pakora": {
    tipNote: null,
    servingSuggestion: "Nane-yoğurt sosu ile sıcak servis edin.",
  },
  "cassoulet": {
    tipNote: null,
    servingSuggestion: "Fırından çıkar çıkmaz, sıcak servis edin.",
  },
  "pot-au-feu": {
    tipNote: null,
    servingSuggestion: "Et suyunu ayrı kasede, et ve sebzeleri tabakta servis edin.",
  },
  "madeleine": {
    tipNote: null,
    servingSuggestion: "Çay veya kahve eşliğinde servis edin.",
  },
  "pan-con-tomate": {
    tipNote: null,
    servingSuggestion: "Zeytinyağını bolca gezdirerek hemen servis edin.",
  },
  "tarta-de-santiago": {
    tipNote: null,
    servingSuggestion: "Pudra şekeri ve bir top vanilyalı dondurma ile servis edin.",
  },
  "fabada-asturiana": {
    tipNote: null,
    servingSuggestion: "Sıcak olarak, ekmek ile servis edin.",
  },
  "amasya-coregi": {
    tipNote: null,
    servingSuggestion: "Çay ile, ılık veya oda sıcaklığında servis edin.",
  },
  "afyon-bukmesi": {
    tipNote: null,
    servingSuggestion: "Ayran veya çay eşliğinde sıcak servis edin.",
  },
};

async function main(): Promise<void> {
  assertDbTarget("fix-boilerplate-tipnotes");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL yok");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    const host = new URL(databaseUrl).host;
    console.log(
      `\n🔧 fix-boilerplate-tipnotes ${DRY_RUN ? "(dry-run)" : "(apply)"} → ${host}\n`,
    );

    // Find all recipes with the boilerplate tipNote
    const boilerplateRecipes = await prisma.recipe.findMany({
      where: { tipNote: BOILERPLATE_TIPNOTE },
      select: { id: true, slug: true, title: true, tipNote: true, servingSuggestion: true },
    });

    console.log(`Boilerplate tipNote bulunan tarif: ${boilerplateRecipes.length}`);

    let updated = 0;
    let skipped = 0;
    let noFix = 0;

    for (const r of boilerplateRecipes) {
      const fix = FIXES[r.slug];
      if (!fix) {
        console.log(`  ⚠ ${r.slug.padEnd(30)}, FIXES map'inde yok, atlanıyor`);
        noFix++;
        continue;
      }

      const tipLabel = fix.tipNote === null ? "→ null" : `→ "${fix.tipNote.substring(0, 50)}..."`;
      const servLabel = fix.servingSuggestion === null
        ? "→ null"
        : `→ "${fix.servingSuggestion.substring(0, 40)}..."`;

      // Also fix servingSuggestion if it's the boilerplate
      const shouldFixServing = r.servingSuggestion === BOILERPLATE_SERVING;

      console.log(`  ${r.slug.padEnd(30)} tipNote ${tipLabel}`);
      if (shouldFixServing) {
        console.log(`  ${"".padEnd(30)} serving ${servLabel}`);
      }

      if (!DRY_RUN) {
        const data: Record<string, unknown> = { tipNote: fix.tipNote };
        if (shouldFixServing && fix.servingSuggestion !== undefined) {
          data.servingSuggestion = fix.servingSuggestion;
        }
        await prisma.recipe.update({
          where: { id: r.id },
          data,
        });
      }
      updated++;
    }

    // Also check for recipes with boilerplate serving but NOT boilerplate tipNote
    const servingOnlyRecipes = await prisma.recipe.findMany({
      where: {
        servingSuggestion: BOILERPLATE_SERVING,
        NOT: { tipNote: BOILERPLATE_TIPNOTE },
      },
      select: { id: true, slug: true, servingSuggestion: true },
    });

    if (servingOnlyRecipes.length > 0) {
      console.log(`\nBoilerplate servingSuggestion-only tarif: ${servingOnlyRecipes.length}`);
      for (const r of servingOnlyRecipes) {
        const fix = FIXES[r.slug];
        if (fix?.servingSuggestion) {
          console.log(`  ${r.slug.padEnd(30)} serving → "${fix.servingSuggestion.substring(0, 40)}..."`);
          if (!DRY_RUN) {
            await prisma.recipe.update({
              where: { id: r.id },
              data: { servingSuggestion: fix.servingSuggestion },
            });
          }
          updated++;
        } else {
          skipped++;
        }
      }
    }

    const verb = DRY_RUN ? "Would update" : "Updated";
    console.log(
      `\n${verb}: ${updated} | No fix defined: ${noFix} | Skipped: ${skipped} | Total boilerplate: ${boilerplateRecipes.length}`,
    );
    if (DRY_RUN) console.log("(dry run, DB'ye dokunulmadı)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
