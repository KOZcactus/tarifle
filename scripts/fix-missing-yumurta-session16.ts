/**
 * Oturum 16: audit-deep ALLERGEN_RULES YUMURTA keywords'e "kek/kurabiye/
 * muffin" eklenmesi sonrası source guard 4 tarifte YUMURTA eksiği tespit
 * etti. Source patch edildi; DB'yi de sync etmek için hardcoded idempotent
 * update.
 *
 *   lamington-yogurt-kup-avustralya-usulu  (Kakaolu kek)
 *   somloi-galuska                         (Kakaolu kek)
 *   pekin-ordegi                           (İnce pankek)
 *   erikli-makowiec-kup-polonya-usulu      (Haşhaşlı kek kırıntısı)
 *
 * Dev:  npx tsx scripts/fix-missing-yumurta-session16.ts --apply
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

const SLUGS = [
  "lamington-yogurt-kup-avustralya-usulu",
  "somloi-galuska",
  "pekin-ordegi",
  "erikli-makowiec-kup-polonya-usulu",
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-missing-yumurta-session16");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    let patched = 0, noop = 0, missing = 0;
    for (const slug of SLUGS) {
      const r = await prisma.recipe.findUnique({
        where: { slug },
        select: { id: true, slug: true, allergens: true },
      });
      if (!r) {
        console.log(`  ⚠  not found: ${slug}`);
        missing++;
        continue;
      }
      const current = r.allergens as Allergen[];
      if (current.includes("YUMURTA")) {
        console.log(`  ⏭  already has YUMURTA: ${slug}`);
        noop++;
        continue;
      }
      const next = Array.from(new Set([...current, "YUMURTA"])).sort() as Allergen[];
      console.log(`  ${apply ? "✅" : "•"} ${slug}  ${JSON.stringify(current)} → ${JSON.stringify(next)}`);
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
