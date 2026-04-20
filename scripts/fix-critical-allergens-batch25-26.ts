/**
 * Batch 25 + 26 CRITICAL allergen fix (idempotent).
 *
 * 27 audit flag → 6 false positive (brief §5 istisnası: hindistancevizi
 * sütü/rende, kavun çekirdeği) + 21 gerçek fix. 3'ü (hardalli-tavuk-sote,
 * kengerli-kuzu-sote, kuru-kayisili-etli-yahni) empty-allergen audit'te
 * zaten prod'a uygulandı, bu script onları da "already clean" olarak
 * raporlar (idempotent). 18 yeni fix uygulanır.
 *
 * Usage:
 *   npx tsx scripts/fix-critical-allergens-batch25-26.ts --apply
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch25-26.ts --apply --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
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
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

interface FixPlan {
  slug: string;
  addAllergens: Allergen[];
  note: string;
}

const fixes: FixPlan[] = [
  { slug: "firikli-tavuk-kapama-diyarbakir-usulu", addAllergens: ["SUT"], note: "tereyağı" },
  { slug: "pastirmali-eriste-omleti-kayseri-usulu", addAllergens: ["SUT"], note: "tereyağı" },
  { slug: "toyga-asi-corbasi-yozgat-usulu", addAllergens: ["YUMURTA"], note: "yumurta (terbiye)" },
  { slug: "comlek-fasulyeli-tirit-konya-usulu", addAllergens: ["SUT"], note: "tereyağı" },
  { slug: "ayran-asi-corbasi-van-usulu", addAllergens: ["YUMURTA"], note: "yumurta (terbiye)" },
  { slug: "kengerli-kuzu-sote-erzincan-usulu", addAllergens: ["SUT"], note: "tereyağı (prod'da zaten fixed)" },
  { slug: "kuru-kayisili-etli-yahni-malatya-usulu", addAllergens: ["SUT"], note: "tereyağı (prod'da zaten fixed)" },
  { slug: "hardalli-tavuk-sote-tekirdag-usulu", addAllergens: ["HARDAL"], note: "hardal (prod'da zaten fixed)" },
  { slug: "tahinli-muzlu-irmik-kasesi-alanya-usulu", addAllergens: ["GLUTEN"], note: "irmik" },
  { slug: "welsh-rarebit-toast-ingiliz-usulu", addAllergens: ["HARDAL"], note: "hardal" },
  { slug: "lemongrass-dana-pirinc-bowl-vietnam-usulu", addAllergens: ["SOYA"], note: "soya sosu" },
  { slug: "avokadolu-misir-mucveri-avustralya-usulu", addAllergens: ["SUT"], note: "yoğurt" },
  { slug: "koz-patlicanli-kuzu-kapama-urfa-usulu", addAllergens: ["SUT"], note: "tereyağı" },
  { slug: "yogurtlu-eriste-corbasi-cankiri-usulu", addAllergens: ["YUMURTA"], note: "yumurta" },
  { slug: "elmali-irmik-kup-aksaray-usulu", addAllergens: ["GLUTEN"], note: "irmik" },
  { slug: "ayranli-evelik-corbasi-erzincan-usulu", addAllergens: ["YUMURTA"], note: "yumurta" },
  { slug: "kaz-etli-bulgur-tava-ardahan-usulu", addAllergens: ["SUT"], note: "tereyağı" },
  { slug: "erikli-kuzu-yahni-van-usulu", addAllergens: ["SUT"], note: "tereyağı" },
  { slug: "kestaneli-mantar-sote-bilecik-usulu", addAllergens: ["KUSUYEMIS"], note: "haşlanmış kestane" },
  { slug: "ayvali-hardalli-yesil-salata-yalova-usulu", addAllergens: ["HARDAL"], note: "hardal" },
  { slug: "hurmali-susamli-irmik-kup-orta-dogu-usulu", addAllergens: ["GLUTEN"], note: "irmik" },
];

async function main(): Promise<void> {
  if (APPLY) assertDbTarget("fix-critical-allergens-batch25-26");

  console.log(`🔧 batch 25-26 CRITICAL allergen fix, ${fixes.length} adet\n`);

  let updated = 0;
  let alreadyClean = 0;
  let notFound = 0;

  for (const f of fixes) {
    const r = await prisma.recipe.findUnique({
      where: { slug: f.slug },
      select: { id: true, allergens: true, title: true },
    });
    if (!r) {
      console.log(`  ⚠️  ${f.slug} DB'de yok`);
      notFound++;
      continue;
    }
    const existing = new Set(r.allergens);
    const toAdd = f.addAllergens.filter((a) => !existing.has(a));
    if (toAdd.length === 0) {
      alreadyClean++;
      continue;
    }
    const next = [...r.allergens, ...toAdd];
    console.log(`  🔧 ${f.slug}: +${toAdd.join(",")}  (${f.note})`);
    if (APPLY) {
      await prisma.recipe.update({ where: { id: r.id }, data: { allergens: next } });
      updated++;
    }
  }

  console.log(
    `\n📊 özet, updated=${updated}, alreadyClean=${alreadyClean}, notFound=${notFound} (apply=${APPLY})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
