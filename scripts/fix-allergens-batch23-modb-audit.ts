/**
 * Batch 23 Mod B import sonrası audit'inde yakalanan 7 allergen düzeltmesi.
 * Codex Mod B JSON'undaki `issues` array'i flag'ledi. Tüm fix'ler gerçek
 * ingredient-allergen mismatch (false positive yok).
 *
 *   1. kaldirikli-yumurtali-tava-samsun-usulu
 *      Yumurta + Tereyağı var, allergen sadece SUT → +YUMURTA
 *
 *   2. misir-unlu-kefal-bugulama-sinop-usulu
 *      Sadece mısır unu (glutensiz), DENIZ_URUNLERI + GLUTEN var → -GLUTEN
 *
 *   3. kestaneli-hamsi-pilavi-zonguldak-usulu
 *      Haşlanmış kestane + hamsi var → +KUSUYEMIS (DENIZ_URUNLERI zaten var)
 *
 *   4. zahterli-yumurta-ekmegi-kilis-usulu
 *      Yumurta + süt + tereyağı var, sadece GLUTEN → +YUMURTA, +SUT
 *
 *   5. hashasli-yumurta-durumu-afyon-usulu
 *      Yumurta + tereyağı var, sadece GLUTEN → +YUMURTA, +SUT
 *
 *   6. pekmezli-elma-tatlisi-nevsehir-usulu
 *      Ceviz var, allergen boş → +KUSUYEMIS
 *
 *   7. kayisili-kuzu-sote-malatya-usulu
 *      Tereyağı var, allergen boş → +SUT
 *
 *   npx tsx scripts/fix-allergens-batch23-modb-audit.ts             # dry run
 *   npx tsx scripts/fix-allergens-batch23-modb-audit.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-allergens-batch23-modb-audit.ts --apply --confirm-prod
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

interface AllergenFix {
  slug: string;
  add: Allergen[];
  remove: Allergen[];
  reason: string;
}

const FIXES: readonly AllergenFix[] = [
  {
    slug: "kaldirikli-yumurtali-tava-samsun-usulu",
    add: ["YUMURTA"],
    remove: [],
    reason: "Yumurta ingredient listede, allergen listesinde eksikti",
  },
  {
    slug: "misir-unlu-kefal-bugulama-sinop-usulu",
    add: [],
    remove: ["GLUTEN"],
    reason: "Sadece mısır unu kullanılıyor (glütensiz); GLUTEN yanlış atanmış",
  },
  {
    slug: "kestaneli-hamsi-pilavi-zonguldak-usulu",
    add: ["KUSUYEMIS"],
    remove: [],
    reason: "Haşlanmış kestane tree-nut grubuna ait",
  },
  {
    slug: "zahterli-yumurta-ekmegi-kilis-usulu",
    add: ["YUMURTA", "SUT"],
    remove: [],
    reason: "Yumurta + süt + tereyağı var, sadece GLUTEN listelenmiş",
  },
  {
    slug: "hashasli-yumurta-durumu-afyon-usulu",
    add: ["YUMURTA", "SUT"],
    remove: [],
    reason: "Yumurta + tereyağı var, sadece GLUTEN listelenmiş",
  },
  {
    slug: "pekmezli-elma-tatlisi-nevsehir-usulu",
    add: ["KUSUYEMIS"],
    remove: [],
    reason: "Ceviz tree-nut; allergen listesi boştu",
  },
  {
    slug: "kayisili-kuzu-sote-malatya-usulu",
    add: ["SUT"],
    remove: [],
    reason: "Tereyağı dairy; allergen listesi boştu",
  },
] as const;

async function main() {
  assertDbTarget("fix-allergens-batch23-modb-audit");

  console.log(`\n🔎 Planned fixes: ${FIXES.length}`);
  let applied = 0;
  let skipped = 0;

  for (const fix of FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, slug: true, allergens: true, title: true },
    });

    if (!recipe) {
      console.log(`  ❌ ${fix.slug} — bulunamadı, atla`);
      skipped++;
      continue;
    }

    const current = new Set(recipe.allergens);
    for (const a of fix.add) current.add(a);
    for (const a of fix.remove) current.delete(a);
    const next = [...current].sort() as Allergen[];

    const prev = [...recipe.allergens].sort().join(",");
    const nextJoined = next.join(",");
    if (prev === nextJoined) {
      console.log(`  ⏭️  ${fix.slug} — değişiklik yok (zaten ${prev})`);
      skipped++;
      continue;
    }

    console.log(`  📝 ${fix.slug}`);
    console.log(`     ${recipe.title}`);
    console.log(`     ${prev || "(boş)"} → ${nextJoined || "(boş)"}`);
    console.log(`     sebep: ${fix.reason}`);

    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { allergens: { set: next } },
      });
      applied++;
    }
  }

  console.log(`\n${APPLY ? "✅" : "🧪"} ${APPLY ? "applied" : "dry-run"}: ${applied}, skipped: ${skipped}`);
  if (!APPLY) console.log("   (re-run with --apply to write)");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
