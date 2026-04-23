/**
 * Oturum 16 spot-fix: 6 over-tag drift (hiçbiri 31a/31b'de değil, eski
 * batch'lerden kalma). audit-over-tagged-allergens raporu:
 *
 *   hamsili-pazi-tava-rize-usulu                  GLUTEN over-tag (mısır unu GF)
 *   misir-unlu-hamsi-koftesi-bartin-usulu         GLUTEN over-tag (mısır unu GF)
 *   fasulyeli-misir-ekmegi-durumu-trabzon-usulu   GLUTEN over-tag, SUT eksik (tereyağı)
 *   dereotlu-patates-corbasi-macar-usulu          SUT over-tag (süt yok)
 *   hindistancevizli-lamington-kup-avustralya-usulu  composite ing "Kek/Krema" → YUMURTA kal, GLUTEN + SUT ekle
 *   hashasli-yogurt-corbasi-afyon-usulu           SUSAM over-tag (haşhaş ezmesi ≠ susam)
 *
 * Idempotent. Dev: npx tsx scripts/fix-overtag-session16-spot.ts --apply
 * Prod: DATABASE_URL=<prod> ... --apply --confirm-prod
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
  remove: Allergen[];
  add: Allergen[];
  reason: string;
}

const FIXES: Fix[] = [
  { slug: "hamsili-pazi-tava-rize-usulu", remove: ["GLUTEN"], add: [], reason: "mısır unu GF" },
  { slug: "misir-unlu-hamsi-koftesi-bartin-usulu", remove: ["GLUTEN"], add: [], reason: "mısır unu GF" },
  { slug: "fasulyeli-misir-ekmegi-durumu-trabzon-usulu", remove: ["GLUTEN"], add: ["SUT"], reason: "mısır ekmeği GF, tereyağı SUT" },
  { slug: "dereotlu-patates-corbasi-macar-usulu", remove: ["SUT"], add: [], reason: "süt/krema yok (patates, soğan, paprika, dereotu, su)" },
  { slug: "hindistancevizli-lamington-kup-avustralya-usulu", remove: [], add: ["GLUTEN", "SUT"], reason: "composite: Kek un içerir, Krema süt" },
  { slug: "hashasli-yogurt-corbasi-afyon-usulu", remove: ["SUSAM"], add: [], reason: "haşhaş ≠ susam (ayrı bitki)" },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-overtag-session16-spot");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    let patched = 0, noop = 0, missing = 0;
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
      const current = r.allergens as Allergen[];
      const afterRemove = current.filter((a) => !f.remove.includes(a));
      const next = Array.from(new Set([...afterRemove, ...f.add])).sort() as Allergen[];
      const same = next.length === current.length && next.every((a, i) => a === [...current].sort()[i]);
      if (same) {
        console.log(`  ⏭  no-op: ${r.slug} (already ${JSON.stringify(next)})`);
        noop++;
        continue;
      }
      console.log(`  ${apply ? "✅" : "•"} ${r.slug}`);
      console.log(`     ${JSON.stringify(current)} → ${JSON.stringify(next)}`);
      console.log(`     reason: ${f.reason}`);
      if (apply) {
        await prisma.recipe.update({
          where: { id: r.id },
          data: { allergens: next },
        });
      }
      patched++;
    }
    console.log(`\n${apply ? "applied" : "dry-run"}: ${patched} patched, ${noop} no-op, ${missing} missing`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
