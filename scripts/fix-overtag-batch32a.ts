/**
 * Batch 32a apply sonrası 5 over-tag tespit; Codex yanlış allergen
 * tagging yapmış. Source + DB sync fix.
 *
 * 1. cevizli-kabak-mucver-burdur-usulu             SUT over (süt yok)
 * 2. karabugdayli-tavuk-firini-rus-usulu            SUT over (süt yok)
 * 3. tantunili-nohut-salatasi-mersin-usulu          GLUTEN over (buğday yok)
 * 4. mercimekli-keci-peynirli-tart-fransiz-usulu    HARDAL over (hardal yok)
 * 5. kimchili-pirinc-mucveri-kore-usulu             SOYA over (doğrudan soya yok)
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

const FIXES: Array<{ slug: string; remove: Allergen; reason: string }> = [
  { slug: "cevizli-kabak-mucver-burdur-usulu", remove: "SUT", reason: "süt ürünü yok" },
  { slug: "karabugdayli-tavuk-firini-rus-usulu", remove: "SUT", reason: "süt ürünü yok" },
  { slug: "tantunili-nohut-salatasi-mersin-usulu", remove: "GLUTEN", reason: "buğday yok" },
  { slug: "mercimekli-keci-peynirli-tart-fransiz-usulu", remove: "HARDAL", reason: "hardal yok" },
  { slug: "kimchili-pirinc-mucveri-kore-usulu", remove: "SOYA", reason: "doğrudan soya ingredient yok" },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-overtag-batch32a");
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
      if (!r) { console.log(`  ⚠  not found: ${f.slug}`); missing++; continue; }
      const current = r.allergens as Allergen[];
      if (!current.includes(f.remove)) {
        console.log(`  ⏭  already clean: ${r.slug}`);
        noop++;
        continue;
      }
      const next = current.filter((a) => a !== f.remove).sort() as Allergen[];
      console.log(`  ${apply ? "✅" : "•"} ${r.slug}  -${f.remove}  (${f.reason})`);
      if (apply) {
        await prisma.recipe.update({ where: { id: r.id }, data: { allergens: next } });
      }
      patched++;
    }
    console.log(`\n${apply ? "applied" : "dry-run"}: ${patched} patched, ${noop} no-op, ${missing} missing`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
