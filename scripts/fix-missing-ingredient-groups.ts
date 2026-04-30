/**
 * Batch fix: ingredient group eksikliği (audit-content MISSING_GROUPS).
 *
 * 21 tarif step text'inde 'şerbet/hamur/marine/dolgu/iç/kaplama' mention
 * ediyor ama ingredient'lerin hiçbirinde group field yok. UX: kullanıcı
 * tarif kart'ında 'Şerbet için', 'Hamur için' gibi alt başlıklar
 * görmez, ingredient list düz akar, hangi malzemenin hangi aşama için
 * olduğu belirsiz.
 *
 * KULLANICI DİREKTİFİ (oturum 34): 'tarifi en doğru şekilde verelim,
 * eksik veya hatalı olmasın'. Bu yüzden:
 * 1. Pattern-bazlı PRIORITY-1 (kesin): ingredient name'inde 'şerbet'
 *    geçiyorsa → Şerbet için (rare ama net match)
 * 2. Context-aware PRIORITY-2: tarif step text mention'larından çıkarılan
 *    aktif group'lara göre, ingredient name'i en iyi eşleşen group'a
 *    map edilir
 * 3. CSV preview ile dry-run, kullanıcı manuel review sonrası --apply
 *
 * Group mapping kuralları (DB'de mevcut group pattern'lerinden derlendi):
 *   ŞERBET   → şeker, su, limon, limon suyu, toz şeker, vanilya
 *   HAMUR    → un, yumurta, tereyağı, sıvı yağ, süt, yoğurt, maya,
 *              kabartma tozu, karbonat, vanilya
 *   MARINE   → sarımsak, soğan, sirke, kekik, kimyon, kişniş, baharat,
 *              soya sosu, mirin, zeytinyağı (marine context)
 *   KAPLAMA  → galeta unu, mısır unu, panko, susam, irmik
 *   DOLGU/İÇ → peynir, kıyma, soğan (dolgu context), sebze, fındık,
 *              ceviz, badem, antep fıstığı
 *
 * Idempotent: ingredient zaten group'lu ise atlar.
 *
 * Usage:
 *   npx tsx scripts/fix-missing-ingredient-groups.ts                    # dev DRY-RUN + CSV
 *   npx tsx scripts/fix-missing-ingredient-groups.ts --apply            # dev apply
 *   npx tsx scripts/fix-missing-ingredient-groups.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const APPLY = process.argv.includes("--apply");
const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

type GroupKey = "Şerbet için" | "Hamur için" | "Marine için" | "Kaplama için" | "İç için" | "Dolgu için";

const GROUP_DETECTORS: { re: RegExp; key: GroupKey }[] = [
  { re: /şerbet(i|ini|le|in)?/i, key: "Şerbet için" },
  { re: /hamur(u|un|una|da)?/i, key: "Hamur için" },
  { re: /marine\s+edin/i, key: "Marine için" },
  { re: /kapla(ma|yın|yarak)/i, key: "Kaplama için" },
  { re: /dolgu(yu|sunu)\s+(hazırla|yap)/i, key: "Dolgu için" },
  { re: /iç(i|ini|in)\s+(hazırla|yap)/i, key: "İç için" },
];

// Ingredient name → matched group keys (lowercase, Turkish-aware match)
const INGREDIENT_GROUP_MAP: { keywords: string[]; groups: GroupKey[] }[] = [
  // ŞERBET kesin
  { keywords: ["şeker", "toz şeker", "pudra şekeri"], groups: ["Şerbet için", "Hamur için"] },
  { keywords: ["limon suyu", "limon"], groups: ["Şerbet için"] },
  { keywords: ["bal"], groups: ["Şerbet için"] },
  { keywords: ["pekmez"], groups: ["Şerbet için"] },
  { keywords: ["tahin"], groups: ["İç için", "Hamur için", "Şerbet için"] },
  // HAMUR kesin
  { keywords: ["un", "buğday unu"], groups: ["Hamur için"] },
  { keywords: ["yumurta"], groups: ["Hamur için"] },
  { keywords: ["maya", "kuru maya", "yaş maya"], groups: ["Hamur için"] },
  { keywords: ["kabartma tozu", "karbonat", "soda"], groups: ["Hamur için"] },
  { keywords: ["vanilya", "vanilin"], groups: ["Hamur için", "Şerbet için"] },
  { keywords: ["yoğurt"], groups: ["Hamur için"] },
  { keywords: ["süt"], groups: ["Hamur için"] },
  { keywords: ["tereyağı", "tereyağ"], groups: ["Hamur için"] },
  // MARINE kesin
  { keywords: ["sarımsak"], groups: ["Marine için"] },
  { keywords: ["soya sosu", "soya"], groups: ["Marine için"] },
  { keywords: ["sirke"], groups: ["Marine için"] },
  { keywords: ["mirin", "sake"], groups: ["Marine için"] },
  { keywords: ["kekik", "kimyon", "kişniş", "biberiye", "köri"], groups: ["Marine için"] },
  { keywords: ["pul biber", "karabiber", "tuz"], groups: ["Marine için"] },
  // KAPLAMA kesin
  { keywords: ["galeta unu", "galeta"], groups: ["Kaplama için"] },
  { keywords: ["mısır unu", "panko", "irmik"], groups: ["Kaplama için", "Hamur için"] },
  { keywords: ["susam"], groups: ["Kaplama için"] },
  // DOLGU/İÇ
  { keywords: ["kıyma"], groups: ["Dolgu için", "İç için"] },
  { keywords: ["peynir", "lor", "beyaz peynir", "kaşar"], groups: ["Dolgu için", "İç için"] },
  { keywords: ["ceviz", "fındık", "badem", "antep fıstığı", "kuru üzüm"], groups: ["İç için", "Dolgu için"] },
];

// Special: "Sıvı yağ" / "Zeytinyağı" context'e göre değişir, KIZARTMA için
// KAPLAMA değil ama MARINE için olabilir. Default: hamur context'te ham/yağ.
const OIL_KEYWORDS = ["sıvı yağ", "zeytinyağı", "ayçiçek yağı"];

interface PlannedFix {
  recipeSlug: string;
  ingredientId: string;
  ingredientName: string;
  group: GroupKey;
}

function detectGroupsInText(text: string): Set<GroupKey> {
  const out = new Set<GroupKey>();
  for (const d of GROUP_DETECTORS) {
    if (d.re.test(text)) out.add(d.key);
  }
  return out;
}

function pickGroup(
  ingredientName: string,
  activeGroups: Set<GroupKey>,
): GroupKey | null {
  const nameLower = ingredientName.toLocaleLowerCase("tr-TR");
  for (const map of INGREDIENT_GROUP_MAP) {
    const hit = map.keywords.some((kw) =>
      nameLower.includes(kw.toLocaleLowerCase("tr-TR")),
    );
    if (!hit) continue;
    // İlk eşleşen aktif group'u seç (priority listede önce gelen).
    for (const g of map.groups) {
      if (activeGroups.has(g)) return g;
    }
  }
  // Yağ keyword'leri context'e göre: hamur > marine > diğer
  if (OIL_KEYWORDS.some((k) => nameLower.includes(k))) {
    if (activeGroups.has("Hamur için")) return "Hamur için";
    if (activeGroups.has("Marine için")) return "Marine için";
    if (activeGroups.has("Kaplama için")) return "Kaplama için";
  }
  return null;
}

async function main(): Promise<void> {
  await assertDbTarget("fix-missing-ingredient-groups");

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      ingredients: { select: { id: true, name: true, group: true } },
      steps: { select: { instruction: true } },
    },
  });

  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const planned: PlannedFix[] = [];
  const noActionNeeded: string[] = [];
  const unmatched: { slug: string; ingredient: string }[] = [];

  for (const r of recipes) {
    const stepText = r.steps.map((s) => s.instruction).join(" ");
    const activeGroups = detectGroupsInText(stepText);
    if (activeGroups.size < 2) continue; // brief MISSING_GROUPS audit ≥ 2 group mention istiyor
    const allUngrouped = r.ingredients.every((i) => !i.group);
    if (!allUngrouped) {
      noActionNeeded.push(r.slug);
      continue;
    }

    for (const ing of r.ingredients) {
      const group = pickGroup(ing.name, activeGroups);
      if (group) {
        planned.push({
          recipeSlug: r.slug,
          ingredientId: ing.id,
          ingredientName: ing.name,
          group,
        });
      } else {
        unmatched.push({ slug: r.slug, ingredient: ing.name });
      }
    }
  }

  // CSV preview
  const csvPath = path.resolve(
    __dirname2,
    "..",
    `docs/ingredient-groups-fix-plan-${isProd ? "prod" : "dev"}.csv`,
  );
  const csvLines = [
    "recipeSlug,ingredientName,suggestedGroup",
    ...planned.map((p) => `${p.recipeSlug},"${p.ingredientName}",${p.group}`),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  // Tarif başına özet
  const bySlug: Record<string, { mapped: number; unmatched: number }> = {};
  for (const p of planned) {
    bySlug[p.recipeSlug] = bySlug[p.recipeSlug] ?? { mapped: 0, unmatched: 0 };
    bySlug[p.recipeSlug].mapped++;
  }
  for (const u of unmatched) {
    bySlug[u.slug] = bySlug[u.slug] ?? { mapped: 0, unmatched: 0 };
    bySlug[u.slug].unmatched++;
  }

  console.log(`Tarif sayısı (multi-group context'li): ${Object.keys(bySlug).length}`);
  console.log(`Planlı group atama: ${planned.length}`);
  console.log(`Eşleşmeyen ingredient: ${unmatched.length} (manuel review gerek)`);
  console.log(`Zaten grup atanmış (atlandı): ${noActionNeeded.length}\n`);

  console.log("Tarif başına dağılım:");
  for (const [slug, c] of Object.entries(bySlug)) {
    console.log(`  ${slug}: mapped=${c.mapped}, unmatched=${c.unmatched}`);
  }

  if (unmatched.length > 0) {
    console.log("\nEşleşmeyen ingredient sample (ilk 15):");
    for (const u of unmatched.slice(0, 15)) {
      console.log(`  [${u.slug}] ${u.ingredient}`);
    }
  }

  console.log(`\nCSV preview: ${csvPath}`);

  if (!APPLY) {
    console.log("\nDry-run, değişiklik yok. Apply için --apply.");
    await prisma.$disconnect();
    return;
  }

  // APPLY
  let applied = 0;
  for (const p of planned) {
    await prisma.recipeIngredient.update({
      where: { id: p.ingredientId },
      data: { group: p.group },
    });
    await prisma.auditLog.create({
      data: {
        action: "INGREDIENT_GROUP_RETROFIT",
        targetType: "RecipeIngredient",
        targetId: p.ingredientId,
        metadata: {
          recipeSlug: p.recipeSlug,
          ingredientName: p.ingredientName,
          group: p.group,
          reason: "audit-content MISSING_GROUPS retrofit (pattern-based context-aware mapping)",
        },
      },
    });
    applied++;
  }

  console.log(`\nAPPLIED: ${applied} ingredient group retrofit'i`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
