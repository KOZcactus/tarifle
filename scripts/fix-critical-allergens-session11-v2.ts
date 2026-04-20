/**
 * Fix 20 CRITICAL allergen findings surfaced by session 11 audit-deep
 * keyword expansion (zahter → SUSAM, krep/beze/kek küpü → YUMURTA,
 * kvas → GLUTEN).
 *
 *   npx tsx scripts/fix-critical-allergens-session11-v2.ts             # dry
 *   npx tsx scripts/fix-critical-allergens-session11-v2.ts --apply     # dev
 *   DATABASE_URL=<prod> ... --apply --confirm-prod                     # prod
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

interface Fix {
  slug: string;
  add: Allergen;
  reason: string;
}

const FIXES: Fix[] = [
  // SUSAM: Zahter = thyme + sesame + sumac mix, gerçek SUSAM
  { slug: "lorlu-zahter-salatasi-kilis-usulu", add: "SUSAM", reason: "Taze zahter" },
  { slug: "zaatarli-labneh-gozleme-levant-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-yogurt-corbasi-hatay-koy-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-domatesli-pide-hatay-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "labneli-zaatar-pide-orta-dogu-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-peynir-durum-hatay-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-katmer-durum-hatay-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "cevizli-zahter-salatasi-hatay-usulu", add: "SUSAM", reason: "Taze zahter" },
  { slug: "zahter-salatasi-hatay-usulu", add: "SUSAM", reason: "Taze zahter" },
  { slug: "zahterli-lorlu-katmer-kilis-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-zeytin-salatasi-hatay-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-tavuk-sis-hatay-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-yumurta-ekmegi-kilis-usulu", add: "SUSAM", reason: "Zahter" },
  { slug: "zahterli-yumurta-ekmegi-hatay-usulu", add: "SUSAM", reason: "Zahter" },
  // SUSAM: Simit = sesame-coated bread
  { slug: "simit-tost", add: "SUSAM", reason: "Simit (susam kaplı)" },
  { slug: "zahterli-nohutlu-krep-hatay-usulu", add: "SUSAM", reason: "Zahter" },
  // YUMURTA: Krep/Beze/Kek küpü yumurtalı hamur ürünleri
  { slug: "turos-palacsinta-kup-macaristan-usulu", add: "YUMURTA", reason: "Krep (pancake, yumurtalı)" },
  { slug: "lamington-krema-kup-avustralya-usulu", add: "YUMURTA", reason: "Kek küpü" },
  { slug: "ahududulu-eton-kup-ingiltere-usulu", add: "YUMURTA", reason: "Beze (yumurta akı + şeker)" },
  // GLUTEN: Kvas = fermented bread beverage
  { slug: "cherry-kvas-cooler-rus-usulu", add: "GLUTEN", reason: "Kvas (fermentasyonlu ekmek içeceği)" },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-critical-allergens-session11-v2");
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
    for (const f of FIXES) {
      const r = await prisma.recipe.findUnique({
        where: { slug: f.slug },
        select: { id: true, slug: true, allergens: true },
      });
      if (!r) {
        console.log(`  ⚠  not found: ${f.slug}`);
        missing++;
        continue;
      }
      if (r.allergens.includes(f.add)) {
        console.log(`  ⏭  already has ${f.add}: ${r.slug}`);
        skipped++;
        continue;
      }
      const next = Array.from(new Set([...r.allergens, f.add])).sort();
      console.log(`  ${apply ? "✅" : "•"} ${r.slug}  +${f.add}  (${f.reason})`);
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
