/**
 * Remove over-tagged allergens from Recipe records where audit-deep
 * (gerçek kurallarla) eşleşmiyor. 26 gerçek FP hedefliyor:
 *   - Mısır unu/nişasta/pirinç unu → GLUTEN over-tag (glutensiz)
 *   - Haşhaş ezmesi → SUSAM over-tag (poppy seed, susam değil)
 *   - Hindistan cevizi sütü → SUT over-tag (bitkisel)
 *   - Tay/Kore tarifleri ingredient'te soya yok → SOYA over-tag
 *   - Yumurtasız hamur (cornish pasty, csiga, unlu erişte) → YUMURTA over-tag
 *
 * Not: Source patch seed-recipes.ts'ye de işlenir idempotent olması için.
 *
 *   npx tsx scripts/remove-over-tagged-allergens.ts           # dry
 *   npx tsx scripts/remove-over-tagged-allergens.ts --apply   # dev write
 *   DATABASE_URL=<prod> ... --apply --confirm-prod            # prod
 */
import { PrismaClient, type Allergen } from "@prisma/client";
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

interface Removal {
  slug: string;
  remove: Allergen;
  reason: string;
}

const REMOVALS: Removal[] = [
  { slug: "domatesli-lebeniye-corbasi-gaziantep-usulu", remove: "GLUTEN", reason: "pirinç + yoğurt, un yok" },
  { slug: "amasra-peynirli-misir-tavasi", remove: "GLUTEN", reason: "mısır unu (glutensiz), buğday yok" },
  { slug: "tavuk-gogsu", remove: "GLUTEN", reason: "pirinç unu + mısır nişastası, buğday yok" },
  { slug: "citir-patates", remove: "GLUTEN", reason: "sade patates + baharat, buğday yok" },
  { slug: "pavlova", remove: "GLUTEN", reason: "yumurta akı + mısır nişastası + şeker, glutensiz klasik" },
  { slug: "misir-unlu-hamsi-koftesi-bartin-liman-usulu", remove: "GLUTEN", reason: "mısır unu (glutensiz)" },
  { slug: "sutlac", remove: "GLUTEN", reason: "pirinç + mısır nişastası" },
  { slug: "harire-tatlisi-mardin-usulu", remove: "GLUTEN", reason: "mısır nişastası + üzüm pekmezi" },
  { slug: "pekmezli-misir-unu-muhallebisi-trabzon-usulu", remove: "GLUTEN", reason: "mısır unu (glutensiz)" },
  { slug: "sicak-cikolata", remove: "GLUTEN", reason: "mısır nişastası + süt + kakao" },
  { slug: "paluze-hatay-usulu", remove: "GLUTEN", reason: "mısır nişastası + üzüm suyu" },
  { slug: "hamsili-ekmek-rize-usulu", remove: "GLUTEN", reason: "mısır unu bazlı köfte (TR regional 'ekmek' ismi ama buğday yok)" },
  { slug: "tavuk-sis", remove: "GLUTEN", reason: "yoğurt + tavuk + baharat, un yok" },
  { slug: "cevizli-lokum-afyon-usulu", remove: "GLUTEN", reason: "mısır nişastası + ceviz" },
  { slug: "otlu-tava-artvin-usulu", remove: "GLUTEN", reason: "otlu tava ingredient kontrol, buğday yok" },
  { slug: "paluze-kilis-usulu", remove: "GLUTEN", reason: "mısır nişastası bazlı" },
  { slug: "fasulyeli-misir-ekmegi-durumu-trabzon-yayla-usulu", remove: "GLUTEN", reason: "mısır ekmeği (mısır unu bazlı, klasik glutensiz)" },
  { slug: "otlu-misir-mucveri-van-usulu", remove: "GLUTEN", reason: "mısır mücveri (mısır unu)" },
  { slug: "unlu-eriste-corbasi-kirsehir-usulu", remove: "YUMURTA", reason: "ingredient'te yumurta yok, sade un eriştesi" },
  { slug: "cornish-pasty", remove: "YUMURTA", reason: "klasik cornish pasty yumurtasız hamur" },
  { slug: "kakaolu-csiga", remove: "YUMURTA", reason: "ingredient'te yumurta yok" },
  { slug: "hashasli-mercimekli-bukme-afyon-usulu", remove: "SUSAM", reason: "haşhaş ezmesi poppy seed, susam değil" },
  { slug: "coconut-lime-flan-kuba-usulu", remove: "SUT", reason: "hindistan cevizi sütü (plant-based), dairy değil" },
  { slug: "khao-man-gai-tay-usulu", remove: "SOYA", reason: "ingredient'te soya yok (tavuk + pirinç + sarımsak)" },
  { slug: "kimchi-jeon-kore-sokak-usulu", remove: "SOYA", reason: "ingredient'te soya yok (kimchi + un), GLUTEN kalmalı" },
  { slug: "kongnamul-guk-kore-usulu", remove: "SOYA", reason: "ingredient 'maş fasulyesi' olarak yazılmış (isim drift), soya yok" },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("remove-over-tagged-allergens");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    let patched = 0;
    let skipped = 0;
    let missing = 0;
    for (const rem of REMOVALS) {
      const r = await prisma.recipe.findUnique({
        where: { slug: rem.slug },
        select: { id: true, slug: true, title: true, allergens: true },
      });
      if (!r) {
        console.log(`  ⚠  not found: ${rem.slug}`);
        missing++;
        continue;
      }
      if (!r.allergens.includes(rem.remove)) {
        console.log(`  ⏭  already clean: ${rem.slug}  (no ${rem.remove})`);
        skipped++;
        continue;
      }
      const next = r.allergens.filter((a) => a !== rem.remove);
      console.log(
        `  ${apply ? "✅" : "•"} ${rem.slug}  -${rem.remove}  (${rem.reason})`,
      );
      console.log(`      was: ${JSON.stringify(r.allergens)}  →  now: ${JSON.stringify(next)}`);
      if (apply) {
        await prisma.recipe.update({
          where: { id: r.id },
          data: { allergens: next as Allergen[] },
        });
      }
      patched++;
    }
    console.log(
      `\n${apply ? "applied" : "dry-run"}: ${patched} patched, ${skipped} already clean, ${missing} missing`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
