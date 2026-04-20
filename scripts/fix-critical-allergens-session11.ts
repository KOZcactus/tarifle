/**
 * Fix 9 CRITICAL allergen findings caught by audit-deep run at oturum 11
 * açılış (pre-existing state, backfill-02 apply ile ilgisiz).
 *
 *   YUMURTA : 1 slug (Çökelekli Biber Dolması)
 *   KEREVIZ : 1 slug (Ayvalı Kereviz Güveci)
 *   GLUTEN  : 7 slug (6 "Un" + 1 "Aşurelik buğday")
 *
 * Ayrıca 10 CRITICAL finding FALSE POSITIVE: hindistancevizi (brief §5),
 * tapyoka unu (manyok, glutensiz), nişasta (default mısır nişastası).
 * Onlar ayrı iş: audit-deep false positive filter güncellemesi.
 *
 * Kullanım:
 *   npx tsx scripts/fix-critical-allergens-session11.ts             # dry run
 *   npx tsx scripts/fix-critical-allergens-session11.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-session11.ts --apply --confirm-prod
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
  {
    slug: "cokelekli-biber-dolmasi-mugla-usulu",
    add: "YUMURTA",
    reason: "ingredient: Yumurta",
  },
  {
    slug: "ayvali-kereviz-guveci-canakkale-usulu",
    add: "KEREVIZ",
    reason: "ingredient: Kereviz",
  },
  {
    slug: "reyhanli-tavuklu-yogurt-corbasi-osmaniye-usulu",
    add: "GLUTEN",
    reason: "ingredient: Un (default buğday)",
  },
  {
    slug: "kapros-zoldbabfozelek-macar-usulu",
    add: "GLUTEN",
    reason: "ingredient: Un (default buğday)",
  },
  {
    slug: "ayranli-yesil-mercimek-corbasi-erzurum-yayla-usulu",
    add: "GLUTEN",
    reason: "ingredient: Un (default buğday)",
  },
  {
    slug: "yogurtlu-nohut-yahni-konya-ova-usulu",
    add: "GLUTEN",
    reason: "ingredient: Un (default buğday)",
  },
  {
    slug: "kurutlu-semizotu-corbasi-erzincan-usulu",
    add: "GLUTEN",
    reason: "ingredient: Aşurelik buğday",
  },
  {
    slug: "katikli-patates-corbasi-sivas-usulu",
    add: "GLUTEN",
    reason: "ingredient: Un (default buğday)",
  },
  {
    slug: "zahterli-yogurt-corbasi-hatay-koy-usulu",
    add: "GLUTEN",
    reason: "ingredient: Un (default buğday)",
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-critical-allergens-session11");
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
    for (const f of FIXES) {
      const r = await prisma.recipe.findUnique({
        where: { slug: f.slug },
        select: { id: true, slug: true, title: true, allergens: true },
      });
      if (!r) {
        console.log(`  ⚠  not found: ${f.slug}`);
        continue;
      }
      if (r.allergens.includes(f.add)) {
        console.log(`  ⏭  already has ${f.add}: ${r.slug}`);
        skipped++;
        continue;
      }
      const next = Array.from(new Set([...r.allergens, f.add])).sort();
      console.log(
        `  ${apply ? "✅" : "•"} ${r.slug}  +${f.add}  (${f.reason})`,
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
      `\n${apply ? "applied" : "dry-run"}: ${patched} patched, ${skipped} already clean`,
    );
    if (!apply) console.log("re-run with --apply to write.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
