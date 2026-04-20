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

/**
 * 4 baseline edge case fix (check-allergen-source SKIP_FINDINGS listesi):
 *
 * 1. dut-pekmezli-kete-kup-erzurum: YUMURTA over-tag idi, audit-deep
 *    keyword 'kete' eklendi (kete yumurtalı hamur), allergen DOĞRU kalır.
 * 2. cheddarli-mantarli-crumpet: GLUTEN over-tag idi, audit keyword
 *    'crumpet' eklendi, allergen DOĞRU kalır.
 * 3. avokadolu-misir-mucver-stack: SUT over-tag, DB'de süt-based yok
 *    (Mısır tanesi + Un + Yumurta + Avokado). SUT kaldır.
 * 4. misirli-pazili-tava-ekmegi-rize: seed vs DB ingredient drift;
 *    seed eski Un/Yoğurt/Pekmez, DB Mısır unu/Pazı/Tereyağı. patch-
 *    source-from-db zaten format-aware, ayrı script tetikleyici.
 */
async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-4-edge-cases");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    // Only real DB mutation: avokadolu-misir-mucver-stack SUT remove
    const r = await prisma.recipe.findUnique({
      where: { slug: "avokadolu-misir-mucver-stack-avustralya-usulu" },
      select: { id: true, slug: true, allergens: true },
    });
    if (!r) {
      console.log("avokadolu-mucver not found");
      return;
    }
    if (!r.allergens.includes("SUT")) {
      console.log("  ⏭  avokadolu-mucver: no SUT to remove");
      return;
    }
    const next = r.allergens.filter((a) => a !== "SUT");
    console.log(`  ${apply ? "✅" : "•"} avokadolu-mucver SUT remove, was ${JSON.stringify(r.allergens)} → ${JSON.stringify(next)}`);
    if (apply) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { allergens: next as Allergen[] },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
