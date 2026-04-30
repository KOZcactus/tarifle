/**
 * Mod K kalıntı title-leak temizlik (oturum 34, source-DB drift batch).
 *
 * Pattern: step.instruction içinde recipe.title tekrar ediliyor (eski Mod K
 * çıktı pattern'i). Örn:
 *   "Ensalada de Aguacate için kesme tahtasını..."  → "Kesme tahtasını..."
 *   "Minzili Domates Tavası ana malzemesini..."     → "Ana malzemeyi..."
 *
 * Audit: 548 tarif, 1616 step affected (prod). Tek tek manuel rewrite
 * imkansız, otomatik strip + cümle başı düzeltme.
 *
 * KULLANICI DİREKTİFİ: 'tarif en doğru olsun'. Risky rewrite yerine
 * dengeli yaklaşım: title geçen substring'i kırp, cümle başını cap'le.
 * Çoğu sample'da gramatik doğru sonuç, edge case'ler (cümle ortasında
 * title) için defer.
 *
 * Pattern stratejisi:
 *   1. Cümle başı: "{Title} {rest}" → "{rest|cap}"
 *   2. Cümle ortası "için": "{Title} için" → "" (silme)
 *   3. Diğer: "{Title}" → "" (kırp + boşluk normalize)
 *
 * Idempotent: title geçen substring kalmamış ise atlanır. AuditLog
 * STEP_TITLE_LEAK_FIX.
 *
 * Usage:
 *   npx tsx scripts/fix-mod-k-title-leak.ts                     # dev DRY-RUN + CSV
 *   npx tsx scripts/fix-mod-k-title-leak.ts --apply             # dev apply
 *   npx tsx scripts/fix-mod-k-title-leak.ts --apply --confirm-prod
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

function capFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}

/**
 * Step instruction'dan title geçen substring'i strip eder.
 *
 * Örnek dönüşümler:
 *   "Ensalada de Aguacate için kesme..."     → "Kesme..."
 *   "Mai Tai için bardağı buzla..."          → "Bardağı buzla..."
 *   "Otlu Mısır Mücveri ana malzemesini..."  → "Ana malzemeyi..."
 *   "Pırasalı Mihaliç Mücveri 3 dakika..."   → "3 dakika..."
 *   "Ensalada Fría de Papa için yeşillikleri..."→ "Yeşillikleri..."
 *
 * Edge case'ler (manuel review için flag):
 *   "Bu Espresso Martini için bardağı..." (title cümle ortasında)
 */
/**
 * Sadece SAFE pattern'leri yakalar. Türkçe agglutination (suffix) içeren
 * title kullanımları skip edilir ('Osso bucoyu' → 'Yu' anlamsız sonuç).
 *
 * Safe pattern listesi (cümle başı):
 *   "{Title} için "                 → strip
 *   "{Title} yapmadan önce"         → "Yapmadan önce"
 *   "{Title} hazırlığında"          → "Hazırlığında"
 *   "{Title} ana malzemesini"       → "Ana malzemeyi"
 *   "{Title} ana malzemeyi"         → "Ana malzemeyi"
 *   "{Title} parçalarını"           → "Parçaları"
 *   "{Title} sosunu"                → "Sosu"
 *   "{Title} hamurunu"              → "Hamuru"
 *   "{Title} (sayı) dakika dinlensin" → "(sayı) dakika dinlensin"
 *   "{Title} başlamadan"            → "Başlamadan"
 *   "{Title} ile gelişmiş"          → atla (cümle ortasında title)
 *   "{Title}-yu/yi/ya/ye/yu/de/da/in/un/u/ı/ü" + verb → SKIP (suffix)
 */
function stripTitleLeak(instruction: string, title: string): string | null {
  const lower = instruction.toLocaleLowerCase("tr-TR");
  const tLower = title.toLocaleLowerCase("tr-TR");
  if (!lower.startsWith(tLower)) return null; // sadece cümle başı

  // Title'ın hemen sonrasındaki karakter
  const afterTitle = instruction.slice(title.length);
  // Türkçe suffix ile bitişik mi (boşluk yok, harf var)
  if (afterTitle.length > 0 && /^[a-zçğıöşüâîû]/i.test(afterTitle)) {
    return null; // "Osso bucoyu" gibi suffix'li, skip
  }

  const after = afterTitle.trim();
  const afterLower = after.toLocaleLowerCase("tr-TR");

  // Safe pattern lookup (priority order)
  const safeReplacements: { prefix: string; replacement: string }[] = [
    { prefix: "için ", replacement: "" }, // strip + cap kalan
    { prefix: "yapmadan önce ", replacement: "Yapmadan önce " },
    { prefix: "hazırlığında ", replacement: "Hazırlığında " },
    { prefix: "ana malzemesini ", replacement: "Ana malzemeyi " },
    { prefix: "ana malzemeyi ", replacement: "Ana malzemeyi " },
    { prefix: "ana malzemelerini ", replacement: "Ana malzemeleri " },
    { prefix: "parçalarını ", replacement: "Parçaları " },
    { prefix: "sosunu ", replacement: "Sosu " },
    { prefix: "hamurunu ", replacement: "Hamuru " },
    { prefix: "başlamadan ", replacement: "Başlamadan " },
    { prefix: "tamamlanınca ", replacement: "Tamamlanınca " },
    { prefix: "yüzeyi ", replacement: "Yüzeyi " },
  ];

  for (const sr of safeReplacements) {
    if (afterLower.startsWith(sr.prefix)) {
      const rest = after.slice(sr.prefix.length);
      const result = sr.replacement + rest;
      // "için " strip → ilk harfi cap'le
      if (sr.replacement === "") {
        return capFirst(rest);
      }
      return result;
    }
  }

  // Pattern eşleşmedi: "{Title} (sayı) dakika dinlensin" gibi numeric başlangıç
  if (/^\d/.test(after)) {
    return capFirst(after);
  }

  // Generic fallback (oturum 34 batch 2): title boşluk sonrası bir kelime
  // ile başlıyor (object suffix'li veya başlangıç verb), strip + cap.
  // Sample:
  //   'Ensalada de Aguacate avokadolarını iri...' → 'Avokadolarını iri...'
  //   'Mai Tai bardağını taze buzla...' → 'Bardağını taze buzla...'
  //   'Erikli Rezene Salatası rezenesini ince...' → 'Rezenesini ince...'
  //   'Keftalı Bulgur Tava başlangıcı olarak...' → 'Başlangıç olarak...'
  // Boşluksuz suffix bitişik durumları (title.length === instruction.length
  // veya bitişik harf) ÜSTTE handle edildi (return null).
  // Sanity: en az 2 kelime sonrası, anlamlı cümle olsun.
  const wordCount = after.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 3) {
    // 'başlangıcı olarak' özel pattern: 'Başlangıç olarak' yapısı
    if (afterLower.startsWith("başlangıcı olarak ")) {
      const rest = after.slice("başlangıcı olarak ".length);
      return "Başlangıç olarak " + rest;
    }
    return capFirst(after);
  }

  // Çok kısa kalanlar: skip (manuel review gerek)
  return null;
}

interface PlannedFix {
  recipeSlug: string;
  recipeTitle: string;
  stepId: string;
  stepNumber: number;
  before: string;
  after: string;
}

async function main(): Promise<void> {
  await assertDbTarget("fix-mod-k-title-leak");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipes = await prisma.recipe.findMany({
    select: {
      slug: true,
      title: true,
      steps: { select: { id: true, stepNumber: true, instruction: true } },
    },
  });
  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const planned: PlannedFix[] = [];
  let skipped_short_title = 0;

  for (const r of recipes) {
    // Single-word title (Mantı, Kunefe vs.) skip - ana ingredient adı yanlışlıkla yakalanabilir
    const titleParts = r.title.split(/\s+/).filter((w) => w.length >= 3);
    if (titleParts.length < 2) {
      skipped_short_title++;
      continue;
    }

    for (const s of r.steps) {
      const newText = stripTitleLeak(s.instruction, r.title);
      if (newText === null) continue;
      if (newText === s.instruction) continue;
      // Sanity: yeni text 10 char altıysa skip (anlam kaybı riski)
      if (newText.length < 10) continue;
      // Sanity: yeni text orijinalin yarısından kısaysa flag (büyük kayıp)
      if (newText.length < s.instruction.length * 0.4) continue;

      planned.push({
        recipeSlug: r.slug,
        recipeTitle: r.title,
        stepId: s.id,
        stepNumber: s.stepNumber,
        before: s.instruction,
        after: newText,
      });
    }
  }

  // CSV preview
  const csvPath = path.resolve(
    __dirname2,
    "..",
    `docs/mod-k-title-leak-fix-plan-${isProd ? "prod" : "dev"}.csv`,
  );
  const escape = (s: string): string => `"${s.replace(/"/g, '""')}"`;
  const csvLines = [
    "recipeSlug,recipeTitle,stepNumber,before,after",
    ...planned.map((p) => `${p.recipeSlug},${escape(p.recipeTitle)},${p.stepNumber},${escape(p.before)},${escape(p.after)}`),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  console.log(`Planlı step fix: ${planned.length}`);
  console.log(`Single-word title skip: ${skipped_short_title}`);
  console.log(`Sample (ilk 5):`);
  for (const p of planned.slice(0, 5)) {
    console.log(`\n  [${p.recipeSlug}] step ${p.stepNumber}`);
    console.log(`  ÖNCE:  ${p.before.slice(0, 100)}...`);
    console.log(`  SONRA: ${p.after.slice(0, 100)}...`);
  }
  console.log(`\nCSV: ${csvPath}`);

  if (!APPLY) {
    console.log("\nDry-run. Apply için --apply.");
    await prisma.$disconnect();
    return;
  }

  let applied = 0;
  for (const p of planned) {
    await prisma.recipeStep.update({
      where: { id: p.stepId },
      data: { instruction: p.after },
    });
    await prisma.auditLog.create({
      data: {
        action: "STEP_TITLE_LEAK_FIX",
        targetType: "RecipeStep",
        targetId: p.stepId,
        metadata: {
          recipeSlug: p.recipeSlug,
          recipeTitle: p.recipeTitle,
          stepNumber: p.stepNumber,
          before: p.before,
          after: p.after,
          reason: "Mod K kalıntı title-leak strip + cümle başı düzelt",
        },
      },
    });
    applied++;
  }
  console.log(`\nAPPLIED: ${applied} step rewrite`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
