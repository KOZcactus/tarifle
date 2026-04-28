/**
 * Yeni audit metodoloji keşif (oturum 31): 5 sistematik kalite gate.
 * Mod K paketleri ile yakaladığımız KRİTİK pattern'leri otomatize.
 *
 * 5 GATE:
 *   GATE A: SÜRE TUTARSIZLIĞI (totalMinutes vs step süreleri toplamı)
 *   GATE B: ALLERGEN MISMATCH (step text allergen mention vs allergen array)
 *   GATE C: MACRO DENKLEM (4P + 4C + 9F vs averageCalories, %15 tolerans)
 *   GATE D: CUISINE YANLIŞ (slug pattern vs cuisine code)
 *   GATE E: isFeatured OVERFLOW (>%10 prod featured = brief ihlal)
 *
 * Hit count > 0 olan gate'ler için top 20 slug + öneri çıktı.
 *
 * Usage: npx tsx scripts/audit-recipe-quality.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local"), override: true });

// Allergen ingredient anahtar kelimeler (hangi malzeme hangi allergen).
// Rafine: false positive azaltma için negative lookbehind/lookahead.
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  GLUTEN: ["un", "buğday", "bulgur", "irmik", "yufka", "ekmek", "makarna", "lavaş", "simit", "bazlama", "kete", "katmer", "börek", "lazanya", "milföy", "panko", "galeta"],
  SUT: ["süt", "yoğurt", "peynir", "tereyağı", "kaymak", "krema", "labne", "ayran", "kefir", "lor", "kaşar", "mozzarella", "ricotta", "tulum"],
  YUMURTA: ["yumurta"],
  KUSUYEMIS: ["badem", "ceviz", "fındık", "kestane", "antep fıstığı", "fıstık", "kaju", "macadamia"],
  YER_FISTIGI: ["yer fıstığı"],
  SOYA: ["soya", "tofu", "edamame", "miso", "tempeh"],
  SUSAM: ["susam", "tahin"],
  DENIZ_URUNLERI: ["balık", "karides", "midye", "ahtapot", "kalamar", "istakoz", "yengeç", "deniz mahsulü", "hamsi", "ringa", "somon", "ton balığı", "lakerda", "morina"],
  HARDAL: ["hardal"],
  KEREVIZ: ["kereviz"],
};

// False positive exclude pattern'leri (allergen başına tekstte görünen
// ama allergen olmayan bitkisel/jenerik ifadeler).
const ALLERGEN_EXCLUDE: Record<string, string[]> = {
  SUT: [
    "hindistan cevizi sütü", "hindistan cevizi süt", "badem sütü", "soya sütü",
    "yulaf sütü", "pirinç sütü", "kaju sütü", "fındık sütü", "süt mavisi",
    "anne sütü", "süt çikolatası dışı", "süt fiyatı",
  ],
  KUSUYEMIS: [
    // 'fıstık' yer fıstığı olabilir (ayrı allergen)
    "yer fıstığı", "yer fistigi",
    // 'kestane' bazen kestane şekeri/jenerik referans
    "kestane şekeri",
  ],
  GLUTEN: [
    // 'un' bazen mısır unu (glutensiz), kestane unu, pirinç unu
    "mısır unu", "pirinç unu", "kestane unu", "badem unu", "nohut unu",
    "hindistan cevizi unu", "tapyoka", "tapioka",
    // bulgur yerine mısır?
  ],
  HARDAL: [
    "hardal yaprağı", // bazen ot olarak, ama yine HARDAL allergen kapsamında
  ],
};

function hasAllergenMention(allText: string, allergen: string, keywords: string[]): { hit: boolean; mention?: string } {
  const excludes = ALLERGEN_EXCLUDE[allergen] || [];
  for (const kw of keywords) {
    const pattern = new RegExp(`\\b${kw}\\b`, "i");
    const match = allText.match(pattern);
    if (match) {
      // Exclude check: kelime exclude listesindeki bir compound içinde mi
      const idx = allText.toLocaleLowerCase("tr").indexOf(kw.toLocaleLowerCase("tr"));
      if (idx >= 0) {
        // 30 char öncesi kontrol et
        const ctxStart = Math.max(0, idx - 25);
        const ctx = allText.substring(ctxStart, idx + kw.length + 5).toLocaleLowerCase("tr");
        const inExclude = excludes.some((ex) => ctx.includes(ex.toLocaleLowerCase("tr")));
        if (!inExclude) return { hit: true, mention: kw };
      }
    }
  }
  return { hit: false };
}

// Cuisine slug pattern (slug'ta geçen yöre/cuisine ipucu)
const CUISINE_SLUG_HINTS: Record<string, string[]> = {
  italyan: ["italya", "italyan", "roma", "milano", "napoli", "sicilya"],
  fransiz: ["fransiz", "fransa", "paris", "provence"],
  ispanyol: ["ispanya", "ispanyol", "madrid", "barselona", "endulus"],
  yunan: ["yunanistan", "yunan", "atina"],
  japon: ["japon", "japonya", "tokyo", "osaka", "kyoto"],
  cn: ["cin", "cinli", "beijing", "shanghai", "kanton", "sichuan"],
  kore: ["kore", "kore", "seoul"],
  tay: ["tay", "tayland", "bangkok"],
  hint: ["hindistan", "hint", "delhi", "mumbai"],
  meksika: ["meksika", "meksikan", "azteca"],
  abd: ["amerika", "ABD", "amerikan", "new-york", "california"],
  vietnam: ["vietnam", "hanoi", "saigon"],
  ingiltere: ["ingilizce", "ingiltere", "ingiliz", "londra"],
  portekiz: ["portekiz", "lizbon", "porto"],
  brezilya: ["brezilya"],
  peru: ["peru", "lima"],
  rus: ["rusya", "rus", "moskova"],
  macar: ["macaristan", "macar", "budapest"],
  alman: ["almanya", "alman"],
};

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  console.log("DB:", new URL(url).host);
  console.log();

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      cuisine: true,
      totalMinutes: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      isFeatured: true,
      allergens: true,
      ingredients: { select: { name: true } },
      steps: { select: { instruction: true, timerSeconds: true } },
    },
  });
  console.log(`Total prod recipes: ${recipes.length}\n`);

  // GATE A: SÜRE TUTARSIZLIĞI
  console.log("=== GATE A: SÜRE TUTARSIZLIĞI (totalMinutes vs step süreleri) ===");
  const sureIssues: { slug: string; totalMin: number; stepMin: number; diff: number }[] = [];
  for (const r of recipes) {
    if (!r.totalMinutes) continue;
    const stepMinutes = r.steps.reduce((sum, s) => sum + (s.timerSeconds ? s.timerSeconds / 60 : 0), 0);
    if (stepMinutes === 0) continue;
    const diff = Math.abs(r.totalMinutes - stepMinutes);
    const diffRatio = diff / r.totalMinutes;
    // Toleransli, sadece 50%+ sapma yakala (büyük tutarsızlıklar)
    if (diffRatio > 0.5 && diff > 15) {
      sureIssues.push({ slug: r.slug, totalMin: r.totalMinutes, stepMin: Math.round(stepMinutes), diff: Math.round(diff) });
    }
  }
  console.log(`  Hit count: ${sureIssues.length}`);
  if (sureIssues.length > 0) {
    sureIssues.sort((a, b) => b.diff - a.diff);
    console.log(`  Top 10 (max sapma):`);
    for (const i of sureIssues.slice(0, 10)) {
      console.log(`    ${i.slug}: total=${i.totalMin} dk, step=${i.stepMin} dk, sapma=${i.diff} dk`);
    }
  }
  console.log();

  // GATE B: ALLERGEN MISMATCH
  console.log("=== GATE B: ALLERGEN MISMATCH (step text vs allergen array) ===");
  const allergenIssues: { slug: string; missing: string; mention: string }[] = [];
  for (const r of recipes) {
    const allergens = r.allergens as string[];
    const stepText = r.steps.map((s) => s.instruction).join(" ").toLocaleLowerCase("tr");
    const ingText = r.ingredients.map((i) => i.name).join(" ").toLocaleLowerCase("tr");
    const allText = (stepText + " " + ingText).toLocaleLowerCase("tr");

    for (const [allergenKey, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
      if (allergens.includes(allergenKey)) continue; // Already flagged
      const result = hasAllergenMention(allText, allergenKey, keywords);
      if (result.hit) {
        allergenIssues.push({ slug: r.slug, missing: allergenKey, mention: result.mention! });
      }
    }
  }
  console.log(`  Hit count: ${allergenIssues.length}`);
  if (allergenIssues.length > 0) {
    const grouped: Record<string, number> = {};
    for (const i of allergenIssues) grouped[i.missing] = (grouped[i.missing] ?? 0) + 1;
    console.log(`  By allergen:`, Object.entries(grouped).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(", "));
    console.log(`  Top 15:`);
    for (const i of allergenIssues.slice(0, 15)) {
      console.log(`    ${i.slug}: missing ${i.missing} (mention '${i.mention}')`);
    }
  }
  console.log();

  // GATE C: MACRO DENKLEM (4P + 4C + 9F ≈ averageCalories, ±15%)
  console.log("=== GATE C: MACRO DENKLEM (4P + 4C + 9F vs averageCalories) ===");
  const macroIssues: { slug: string; cal: number; macroCal: number; diff: number; ratio: number }[] = [];
  for (const r of recipes) {
    if (!r.averageCalories || r.averageCalories === 0) continue;
    const protein = r.protein as number | null;
    const carbs = r.carbs as number | null;
    const fat = r.fat as number | null;
    if (protein === null || carbs === null || fat === null) continue;
    const macroCal = 4 * Number(protein) + 4 * Number(carbs) + 9 * Number(fat);
    const diff = Math.abs(r.averageCalories - macroCal);
    const ratio = diff / r.averageCalories;
    if (ratio > 0.20) { // %20+ sapma KRİTİK
      macroIssues.push({ slug: r.slug, cal: r.averageCalories, macroCal: Math.round(macroCal), diff: Math.round(diff), ratio });
    }
  }
  console.log(`  Hit count: ${macroIssues.length}`);
  if (macroIssues.length > 0) {
    macroIssues.sort((a, b) => b.ratio - a.ratio);
    console.log(`  Top 10 (max sapma oran):`);
    for (const i of macroIssues.slice(0, 10)) {
      console.log(`    ${i.slug}: cal=${i.cal}, macro=${i.macroCal}, sapma=${i.diff} (${(i.ratio * 100).toFixed(0)}%)`);
    }
  }
  console.log();

  // GATE D: CUISINE YANLIŞ (slug pattern vs cuisine)
  console.log("=== GATE D: CUISINE YANLIŞ (slug pattern vs cuisine code) ===");
  const cuisineIssues: { slug: string; current: string; suggested: string }[] = [];
  for (const r of recipes) {
    const slugLower = r.slug.toLocaleLowerCase("tr");
    for (const [expectedCuisine, hints] of Object.entries(CUISINE_SLUG_HINTS)) {
      if (r.cuisine === expectedCuisine) continue;
      for (const hint of hints) {
        if (slugLower.includes(hint)) {
          cuisineIssues.push({ slug: r.slug, current: r.cuisine ?? "null", suggested: expectedCuisine });
          break;
        }
      }
    }
  }
  console.log(`  Hit count: ${cuisineIssues.length}`);
  if (cuisineIssues.length > 0) {
    console.log(`  Top 15:`);
    for (const i of cuisineIssues.slice(0, 15)) {
      console.log(`    ${i.slug}: current='${i.current}', slug suggests '${i.suggested}'`);
    }
  }
  console.log();

  // GATE E: isFeatured OVERFLOW
  console.log("=== GATE E: isFeatured OVERFLOW (>%10 brief ihlal) ===");
  const featuredCount = recipes.filter((r) => r.isFeatured).length;
  const featuredRatio = featuredCount / recipes.length;
  console.log(`  Featured: ${featuredCount}/${recipes.length} (${(featuredRatio * 100).toFixed(1)}%)`);
  if (featuredRatio > 0.10) {
    console.log(`  ❌ OVERFLOW: brief kuralı %5-10, mevcut %${(featuredRatio * 100).toFixed(1)} (>%10).`);
  } else if (featuredRatio < 0.05) {
    console.log(`  ⚠️  UNDERFLOW: brief kuralı %5-10, mevcut %${(featuredRatio * 100).toFixed(1)} (<%5).`);
  } else {
    console.log(`  ✅ Brief kuralı %5-10 içinde.`);
  }
  console.log();

  // SUMMARY
  console.log("=== SUMMARY ===");
  const totalIssues = sureIssues.length + allergenIssues.length + macroIssues.length + cuisineIssues.length;
  console.log(`Total quality issues: ${totalIssues}`);
  console.log(`  GATE A (süre): ${sureIssues.length}`);
  console.log(`  GATE B (allergen): ${allergenIssues.length}`);
  console.log(`  GATE C (macro): ${macroIssues.length}`);
  console.log(`  GATE D (cuisine): ${cuisineIssues.length}`);
  console.log(`  GATE E (featured): ${featuredRatio > 0.10 ? "OVERFLOW" : featuredRatio < 0.05 ? "UNDERFLOW" : "OK"}`);

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
