/**
 * Oturum 16 final spot-fix: audit-deep prod üzerindeki 10
 * ALLERGEN_ACCURACY CRITICAL.
 *
 * Durum: source'ta doğru ama DB sync eksik olan kayıtlar (oturum 15
 * over-tag fix sırasında missing patch atlanmış). İki tip fix:
 *
 * 1) Allergen eklemek (8 tarif, source zaten doğru):
 *    - raventli-krem-kup-ingiltere-usulu        +YUMURTA
 *    - kerevizli-rezeneli-balik-corbasi-isvec   +KEREVIZ
 *    - zahterli-lor-tost-hatay-usulu            +SUSAM
 *    - kestaneli-tavuk-kapama-bursa-usulu       +KUSUYEMIS
 *    - portakalli-irmik-muhallebisi-mugla       +GLUTEN
 *    - pastirmali-mercimek-pilavi-kayseri       +GLUTEN
 *    - kakuleli-armut-kup-isvec-usulu           +GLUTEN
 *    - hardalli-artsoppa                        +HARDAL (source'a da eklendi bu commit)
 *
 * 2) Ingredient rename (2 tarif, DB'de eski isim kalmış):
 *    - passiflorali-pisco-cooler-peru-usulu     "Passiflora püresi" -> "Maracuya"
 *    - balkabakli-tavuk-tepsi-firini-avustralya "Tavuk baget"        -> "Tavuk but"
 *
 * Dev:  npx tsx scripts/fix-critical-allergens-session16-final.ts --apply
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

interface AllergenAdd {
  kind: "allergen";
  slug: string;
  add: Allergen;
  reason: string;
}

interface IngredientRename {
  kind: "rename";
  slug: string;
  from: string;
  to: string;
  reason: string;
}

type Fix = AllergenAdd | IngredientRename;

const FIXES: Fix[] = [
  { kind: "allergen", slug: "raventli-krem-kup-ingiltere-usulu", add: "YUMURTA", reason: "Kek kırıntısı (source'ta zaten vardı)" },
  { kind: "allergen", slug: "kerevizli-rezeneli-balik-corbasi-isvec-usulu", add: "KEREVIZ", reason: "Kereviz sapı" },
  { kind: "allergen", slug: "zahterli-lor-tost-hatay-usulu", add: "SUSAM", reason: "Zahter (sumak + kekik + susam karışımı)" },
  { kind: "allergen", slug: "kestaneli-tavuk-kapama-bursa-usulu", add: "KUSUYEMIS", reason: "Haşlanmış kestane" },
  { kind: "allergen", slug: "portakalli-irmik-muhallebisi-mugla-usulu", add: "GLUTEN", reason: "İrmik (buğday)" },
  { kind: "allergen", slug: "pastirmali-mercimek-pilavi-kayseri-usulu", add: "GLUTEN", reason: "Pilavlık bulgur" },
  { kind: "allergen", slug: "kakuleli-armut-kup-isvec-usulu", add: "GLUTEN", reason: "Yulaf bisküvisi" },
  { kind: "allergen", slug: "hardalli-artsoppa", add: "HARDAL", reason: "Hardal (source'a da eklendi)" },
  { kind: "rename", slug: "passiflorali-pisco-cooler-peru-usulu", from: "Passiflora püresi", to: "Maracuya", reason: "Passiflora substring audit SUT false-positive; source zaten Maracuya" },
  { kind: "rename", slug: "balkabakli-tavuk-tepsi-firini-avustralya-usulu", from: "Tavuk baget", to: "Tavuk but", reason: "Baget GLUTEN false-positive (tavuk but drumstick, Fransız ekmeği değil); source zaten Tavuk but" },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-critical-allergens-session16-final");
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
        select: { id: true, slug: true, allergens: true, ingredients: { select: { id: true, name: true } } },
      });
      if (!r) {
        console.log(`  ⚠  not found: ${f.slug}`);
        missing++;
        continue;
      }
      if (f.kind === "allergen") {
        const current = r.allergens as Allergen[];
        if (current.includes(f.add)) {
          console.log(`  ⏭  already has ${f.add}: ${r.slug}`);
          noop++;
          continue;
        }
        const next = Array.from(new Set([...current, f.add])).sort() as Allergen[];
        console.log(`  ${apply ? "✅" : "•"} ${r.slug}  +${f.add}  (${f.reason})`);
        if (apply) {
          await prisma.recipe.update({ where: { id: r.id }, data: { allergens: next } });
        }
        patched++;
      } else {
        const ing = r.ingredients.find((i) => i.name === f.from);
        if (!ing) {
          const alreadyRenamed = r.ingredients.some((i) => i.name === f.to);
          if (alreadyRenamed) {
            console.log(`  ⏭  already renamed (${f.to}): ${r.slug}`);
            noop++;
            continue;
          }
          console.log(`  ⚠  ingredient "${f.from}" not found in ${r.slug}`);
          missing++;
          continue;
        }
        console.log(`  ${apply ? "✅" : "•"} ${r.slug}  "${f.from}" -> "${f.to}"  (${f.reason})`);
        if (apply) {
          await prisma.recipeIngredient.update({
            where: { id: ing.id },
            data: { name: f.to },
          });
        }
        patched++;
      }
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
