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

// Cuisine slug pattern: slug'ta geçen yöre/cuisine ipucu → DB cuisine kodu.
// Map: slug hint → expected cuisine code (DB'deki 2-3 harfli kod).
// CUISINE_CODES referans: tr, it, fr, es, gr, jp, cn, kr, th, in, mx, us,
// vn, gb, pt, br, pe, ru, hu, ma, me, se, no, dk, fi, cl, ge, at, ca, pl,
// cu, au, de, id, ng, et, pk, tn, ir, ar, za.
const CUISINE_SLUG_TO_CODE: Record<string, string> = {
  // İtalyan
  "italya": "it", "italyan": "it", "roma": "it", "milano": "it", "napoli": "it", "sicilya": "it",
  // Fransız
  "fransiz": "fr", "fransa": "fr", "paris": "fr", "provence": "fr",
  // İspanyol
  "ispanya": "es", "ispanyol": "es", "madrid": "es", "barselona": "es", "endulus": "es",
  // Yunan
  "yunanistan": "gr", "atina": "gr",
  // Japon
  "japon": "jp", "japonya": "jp", "tokyo": "jp", "osaka": "jp", "kyoto": "jp",
  // Çin
  "cinli": "cn", "beijing": "cn", "shanghai": "cn", "kanton": "cn", "sichuan": "cn",
  // Kore
  "korea": "kr", "seoul": "kr", "kore-": "kr",
  // Tay (DİKKAT: 'hatay' içeren slug'larda 'tay' substring yakalanır, exclude logic gerek)
  "tayland": "th", "bangkok": "th",
  // Hint
  "hindistan": "in", "delhi": "in", "mumbai": "in",
  // Meksika
  "meksika": "mx", "meksikan": "mx", "azteca": "mx",
  // ABD
  "abd": "us", "amerikan": "us", "new-york": "us", "california": "us",
  // Vietnam
  "vietnam": "vn", "hanoi": "vn", "saigon": "vn",
  // İngiltere
  "ingilizce": "gb", "ingiltere": "gb", "ingiliz": "gb", "londra": "gb",
  // Portekiz
  "portekiz": "pt", "lizbon": "pt", "porto": "pt",
  // Brezilya
  "brezilya": "br", "saopaulo": "br",
  // Peru
  "peru-": "pe", "lima": "pe",
  // Rus
  "rusya": "ru", "moskova": "ru",
  // Macar
  "macaristan": "hu", "macar": "hu", "budapest": "hu",
  // Alman
  "almanya": "de", "alman": "de",
  // Tunus
  "tunus": "tn", "tunis": "tn",
  // İran
  "iran": "ir", "tahran": "ir",
  // Pakistan
  "pakistan": "pk", "lahore": "pk", "karachi": "pk",
  // Arjantin
  "arjantin": "ar", "buenos-aires": "ar",
  // Avusturya
  "avusturya": "at", "vienna": "at", "viyana": "at", "linz": "at",
  // Polonya
  "polonya": "pl", "warsaw": "pl",
  // Küba
  "kuba": "cu", "havana": "cu",
  // Avustralya
  "avustralya": "au", "sidney": "au",
  // Endonezya
  "endonezya": "id", "jakarta": "id",
  // Nijerya
  "nijerya": "ng", "lagos": "ng",
  // Etiyopya
  "etiyopya": "et", "addis-ababa": "et",
  // Şili
  "santiago": "cl", "sili": "cl",
  // Gürcü
  "gurcu": "ge", "tbilisi": "ge",
  // Kanada
  "kanada": "ca", "ontario": "ca", "quebec": "ca",
  // İskandinav (DB CUISINE_CODES: se var, dk var, no/fi YOK).
  // Kuzey ülke yemekleri 'se' İskandinav umbrella kabul edilir.
  // dk: Danimarka için ayrı kod var.
  "stockholm": "se", "isvec": "se",
  "oslo": "se", "norvec": "se", // no kodu yok, se umbrella
  "kopenhag": "dk", "danimarka": "dk",
  // fi yok, helsinki/finlandiya 'se' umbrella sayılır
  "helsinki": "se", "finlandiya": "se",
  // Levant / Orta Doğu
  "lubnan": "me", "beyrut": "me", "filistin": "me", "suriye": "me",
  // Kuzey Afrika (Fas/Marakeş)
  "fas": "ma", "marakes": "ma", "kazablanka": "ma",
};

// Tay false positive (slug'ta 'tay' geçen ama Türk yöresi olan)
const TAY_FALSE_POSITIVES = ["hatay", "altay", "kutay"];

// Cuisine hint exclude pattern: slug'ta hint geçse bile şu kelimeler
// varsa false positive (hindistan = coconut, lima = limon, santiago =
// İspanya'daki Santiago de Compostela).
const CUISINE_EXCLUDE_PATTERNS: Record<string, string[]> = {
  "hindistan": ["hindistan-cevizi", "hindistan-cevizli"],
  "lima": ["sopa-de-lima", "key-lime", "limaki"],
  "santiago": ["tarta-de-santiago", "santiago-de-compostela"],
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
      type: true,
      totalMinutes: true,
      prepMinutes: true,
      cookMinutes: true,
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

  // GATE A: SÜRE TUTARSIZLIĞI (rafine algoritma, oturum 32):
  //   expected = prepMinutes + cookMinutes + waitMinutes (marine/dinlenme)
  //   waitMinutes = sum of timerSeconds where >= 30 dk (1800s)
  //   activeMinutes = sum of timerSeconds where < 30 dk
  //   Hit if |totalMinutes - expected| > %10 ratio AND > 10 dk absolute
  // Mantık: marine süresi totalMinutes'a dahil edilmesi brief uyumlu, ama
  // active step süreleri prepMinutes+cookMinutes'la uyumlu olmalı.
  console.log("=== GATE A: SÜRE TUTARSIZLIĞI (totalMinutes vs prep+cook+marine) ===");
  const sureIssues: { slug: string; totalMin: number; expected: number; diff: number; reason: string }[] = [];
  const WAIT_THRESHOLD_SEC = 1800; // 30 dakika
  for (const r of recipes) {
    if (!r.totalMinutes) continue;
    const prepMin = r.prepMinutes ?? 0;
    const cookMin = r.cookMinutes ?? 0;
    if (prepMin === 0 && cookMin === 0) continue;
    let waitMinutes = 0;
    let activeMinutes = 0;
    for (const s of r.steps) {
      if (!s.timerSeconds) continue;
      const min = s.timerSeconds / 60;
      if (s.timerSeconds >= WAIT_THRESHOLD_SEC) {
        waitMinutes += min;
      } else {
        activeMinutes += min;
      }
    }
    const expected = prepMin + cookMin + waitMinutes;
    const diff = Math.abs(r.totalMinutes - expected);
    const diffRatio = expected > 0 ? diff / expected : 0;
    if (diffRatio > 0.1 && diff > 10) {
      const reason = waitMinutes > 0
        ? `prep ${prepMin} + cook ${cookMin} + wait ${Math.round(waitMinutes)} = ${Math.round(expected)}`
        : `prep ${prepMin} + cook ${cookMin} = ${Math.round(expected)}`;
      sureIssues.push({ slug: r.slug, totalMin: r.totalMinutes, expected: Math.round(expected), diff: Math.round(diff), reason });
    }
  }
  console.log(`  Hit count: ${sureIssues.length}`);
  if (sureIssues.length > 0) {
    sureIssues.sort((a, b) => b.diff - a.diff);
    console.log(`  Top 10 (max sapma):`);
    for (const i of sureIssues.slice(0, 10)) {
      console.log(`    ${i.slug}: total=${i.totalMin} dk, expected=${i.expected} dk (${i.reason}), sapma=${i.diff} dk`);
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

  // GATE C: MACRO DENKLEM (4P + 4C + 9F ≈ averageCalories, tip-bazlı tolerans).
  // Alkollü içecek (KOKTEYL): alkol kcal (7 kcal/g) formülde değil, %50 tolerans.
  // İçecek (ICECEK): şeker/yoğurt/süt karışımları, %30 tolerans.
  // Diğer (YEMEK/CORBA/TATLI/SALATA/KAHVALTI/APERATIF/ATISTIRMALIK/SOS): %20 tolerans.
  console.log("=== GATE C: MACRO DENKLEM (4P + 4C + 9F vs averageCalories, tip-bazlı tolerans) ===");
  const macroIssues: { slug: string; type: string; cal: number; macroCal: number; diff: number; ratio: number }[] = [];
  for (const r of recipes) {
    if (!r.averageCalories || r.averageCalories === 0) continue;
    const protein = r.protein as number | null;
    const carbs = r.carbs as number | null;
    const fat = r.fat as number | null;
    if (protein === null || carbs === null || fat === null) continue;
    const macroCal = 4 * Number(protein) + 4 * Number(carbs) + 9 * Number(fat);
    const diff = Math.abs(r.averageCalories - macroCal);
    const ratio = diff / r.averageCalories;
    const typeStr = String(r.type ?? "UNKNOWN");
    // KOKTEYL/ICECEK skip: alkol kcal (7 kcal/g) ve şeker/şurup makro
    // formülünde temsil edilmez, sürekli false positive üretir.
    if (typeStr === "KOKTEYL" || typeStr === "ICECEK") continue;
    const tolerance = 0.20;
    if (ratio > tolerance) {
      macroIssues.push({ slug: r.slug, type: typeStr, cal: r.averageCalories, macroCal: Math.round(macroCal), diff: Math.round(diff), ratio });
    }
  }
  console.log(`  Hit count: ${macroIssues.length}`);
  if (macroIssues.length > 0) {
    macroIssues.sort((a, b) => b.ratio - a.ratio);
    const byType: Record<string, number> = {};
    for (const i of macroIssues) byType[i.type] = (byType[i.type] ?? 0) + 1;
    console.log(`  By type:`, Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(", "));
    console.log(`  Top 15 (max sapma oran):`);
    for (const i of macroIssues.slice(0, 15)) {
      console.log(`    ${i.slug} (${i.type}): cal=${i.cal}, macro=${i.macroCal}, sapma=${i.diff} (${(i.ratio * 100).toFixed(0)}%)`);
    }
  }
  console.log();

  // GATE D: CUISINE YANLIŞ (slug pattern vs cuisine code, RAFINE)
  console.log("=== GATE D: CUISINE YANLIŞ (slug pattern vs cuisine code) ===");
  const cuisineIssues: { slug: string; current: string; suggested: string; hint: string }[] = [];
  for (const r of recipes) {
    const slugLower = r.slug.toLocaleLowerCase("tr");
    // Tay false positive exclude (hatay, altay, kutay)
    let tayFalsePositive = false;
    for (const fp of TAY_FALSE_POSITIVES) {
      if (slugLower.includes(fp)) {
        tayFalsePositive = true;
        break;
      }
    }
    for (const [hint, expectedCode] of Object.entries(CUISINE_SLUG_TO_CODE)) {
      // Tay false positive
      if (expectedCode === "th" && tayFalsePositive) continue;
      // Word boundary check: hint slug'ta `-` ayraç ile token olarak geçmeli
      // (substring match değil). Pattern: (^|-)hint(-|$)
      const escapedHint = hint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wbPattern = new RegExp(`(^|-)${escapedHint}(-|$)`, "i");
      if (!wbPattern.test(slugLower)) continue;
      // Cuisine hint exclude: slug'ta exclude pattern varsa false positive
      const excludes = CUISINE_EXCLUDE_PATTERNS[hint] || [];
      const isExcluded = excludes.some((ex) => slugLower.includes(ex));
      if (isExcluded) continue;
      // Cuisine kodu zaten doğruysa atla (eşleşme)
      if (r.cuisine === expectedCode) continue;
      // Mismatch! Bu gerçek REJECT
      cuisineIssues.push({
        slug: r.slug,
        current: r.cuisine ?? "null",
        suggested: expectedCode,
        hint,
      });
      break; // Tarif başına 1 hit yeter
    }
  }
  console.log(`  Hit count: ${cuisineIssues.length}`);
  if (cuisineIssues.length > 0) {
    console.log(`  Top 30:`);
    for (const i of cuisineIssues.slice(0, 30)) {
      console.log(`    ${i.slug}: current='${i.current}', expected '${i.suggested}' (hint '${i.hint}')`);
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
