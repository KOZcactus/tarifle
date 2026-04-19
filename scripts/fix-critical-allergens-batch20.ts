/**
 * Fix CRITICAL allergen findings for Codex batch 20 seed.
 *
 * Seven ingredient-allergen mismatches caught by audit-batch18-inline.ts
 * (`--last 100 --label "batch 20"`):
 *
 *   Tereyağı → SUT:        2 slug (Tokat mahlepli mercimek, Tamago Sando)
 *   Yoğurt  → SUT:         1 slug (ABD cranberry chicken salad)
 *   İrmik   → GLUTEN:      1 slug (Kahramanmaraş cevizli irmik helvası)
 *   Ceviz   → KUSUYEMIS:   1 slug (Nevşehir pekmezli bulgur peltesi)
 *   Susam   → SUSAM:       1 slug (Nasu Dengaku)
 *   Yer fıstığı → YER_FISTIGI: 1 slug (Poha)
 *
 * One additional keyword hit ("olgun muz" → "un " substring match on
 * Moqueca de Banana) was a false positive — manyok unu (cassava flour)
 * is gluten-free, and the rule's `un ` pattern grabbed the "un m" span
 * in "olgun muz". Exclusion pattern will be tightened in a follow-up.
 *
 *   npx tsx scripts/fix-critical-allergens-batch20.ts             # dry run
 *   npx tsx scripts/fix-critical-allergens-batch20.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-critical-allergens-batch20.ts --apply --confirm-prod
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

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

const ALLERGEN_FIXES: readonly {
  slug: string;
  add: Allergen[];
  reason: string;
}[] = [
  { slug: "mahlepli-yesil-mercimek-corbasi-tokat-bag-usulu", add: ["SUT"], reason: "Tereyağı" },
  { slug: "pekmezli-bulgur-peltesi-nevsehir-usulu", add: ["KUSUYEMIS"], reason: "Ceviz" },
  { slug: "cevizli-irmik-helvasi-kahramanmaras-usulu", add: ["GLUTEN"], reason: "İrmik (semolina)" },
  { slug: "cranberry-chicken-salad-abd-delicatessen-usulu", add: ["SUT"], reason: "Yoğurt" },
  { slug: "nasu-dengaku-japon-izgara-usulu", add: ["SUSAM"], reason: "Susam" },
  { slug: "poha-hint-kahvalti-usulu", add: ["YER_FISTIGI"], reason: "Yer fıstığı" },
  { slug: "tamago-sando-japon-kafe-usulu", add: ["SUT"], reason: "Süt ekmeği" },
];

const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN",
  "SUT",
  "YUMURTA",
  "KUSUYEMIS",
  "YER_FISTIGI",
  "SOYA",
  "DENIZ_URUNLERI",
  "SUSAM",
  "KEREVIZ",
  "HARDAL",
];

async function main(): Promise<void> {
  assertDbTarget("fix-critical-allergens-batch20");
  console.log(
    `🔧 fix-critical-allergens-batch20 (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: ALLERGEN_FIXES.map((f) => f.slug) } },
    select: { id: true, slug: true, allergens: true },
  });

  let updated = 0;
  let alreadyClean = 0;
  let missing = 0;

  for (const fix of ALLERGEN_FIXES) {
    const recipe = recipes.find((r) => r.slug === fix.slug);
    if (!recipe) {
      console.log(`  ⚠ ${fix.slug} — DB'de yok (atlandı)`);
      missing++;
      continue;
    }

    const current = new Set<Allergen>(recipe.allergens as Allergen[]);
    const toAdd = fix.add.filter((a) => !current.has(a));

    if (toAdd.length === 0) {
      console.log(`  ⏭  ${fix.slug} — zaten temiz (${[...current].join(", ") || "none"})`);
      alreadyClean++;
      continue;
    }

    for (const a of toAdd) current.add(a);
    const sorted = ALLERGEN_ORDER.filter((a) => current.has(a));

    console.log(
      `  ${APPLY ? "✅" : "🔍"} ${fix.slug} — +${toAdd.join(", ")} (${fix.reason}) → [${sorted.join(", ")}]`,
    );

    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { allergens: sorted },
      });
      updated++;
    }
  }

  console.log(
    `\nÖzet: ${APPLY ? `${updated} güncellendi` : "dry-run"}, ${alreadyClean} zaten temiz, ${missing} DB'de yok.`,
  );
}

main()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
