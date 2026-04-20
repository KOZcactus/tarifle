/**
 * Fix 3 CRITICAL allergen findings from batch 27 inline audit (tereyağı→SUT).
 * 3 false positive (hindistancevizi brief §5 istisnası) atlanır.
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

const FIXES: { slug: string; add: Allergen; reason: string }[] = [
  { slug: "pastirmali-kuru-domatesli-yumurta-kayseri-usulu", add: "SUT", reason: "Tereyağı" },
  { slug: "dereotlu-patates-yumurta-tava-isvec-usulu", add: "SUT", reason: "Tereyağı" },
  { slug: "yesil-soganli-omlet-banh-mi-tost-vietnam-usulu", add: "SUT", reason: "Tereyağı" },
  { slug: "labneli-zahterli-bazlama-antalya-usulu", add: "SUSAM", reason: "Zahter" },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-critical-allergens-batch27");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    let patched = 0, skipped = 0, missing = 0;
    for (const f of FIXES) {
      const r = await prisma.recipe.findUnique({
        where: { slug: f.slug },
        select: { id: true, slug: true, allergens: true },
      });
      if (!r) { console.log(`  ⚠  not found: ${f.slug}`); missing++; continue; }
      if (r.allergens.includes(f.add)) { console.log(`  ⏭  already has ${f.add}: ${r.slug}`); skipped++; continue; }
      const next = Array.from(new Set([...r.allergens, f.add])).sort();
      console.log(`  ${apply ? "✅" : "•"} ${r.slug}  +${f.add}  (${f.reason})`);
      if (apply) {
        await prisma.recipe.update({ where: { id: r.id }, data: { allergens: next as Allergen[] } });
      }
      patched++;
    }
    console.log(`\n${apply ? "applied" : "dry-run"}: ${patched} patched, ${skipped} already, ${missing} missing`);
  } finally { await prisma.$disconnect(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
