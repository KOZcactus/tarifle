/**
 * GPT 5 Pro audit (oturum 25), deterministic 3517 tarif retroactive
 * nutrition anomaly tarama. Mod K v2 Codex pipeline'a paralel hızlı
 * deterministic check; yağ + kalori + macro tutarlılığı tabaka tabaka.
 *
 * 3 alarm tipi:
 *
 * A) Macro formula deviation (ekstra sıkı): 4×P + 4×C + 9×F vs
 *    averageCalories ±%30 sapma var mı? Kural 10 mevcut Mod K verify
 *    %25 tolerance koymuş; buradaki eşik %30 ve genişletilmiş scope
 *    (tüm 3517).
 *
 * B) HIGH_FAT_INGREDIENTS lookup: Yüksek-yağ ingredient varsa porsiyon
 *    başı yağ ingredient gram × yağ ratio ile kaba tahmin → DB averageFat
 *    ile fark > %50 ise alarm. Codex Mod K v2 Kural 10 manual yakalar
 *    ama deterministic script daha hızlı.
 *
 * C) Sıfır/null nutrition: averageCalories null veya 0 ile ingredient
 *    listesi 5+ malzemeli; veri eksikliği alarmı.
 *
 * Çıktı: docs/nutrition-anomaly-report.md
 *
 * Usage:
 *   npx tsx scripts/audit-nutrition-anomaly.ts
 *   npx tsx scripts/audit-nutrition-anomaly.ts --threshold 50
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

// HIGH_FAT_INGREDIENTS map (gram başına yağ oranı %). Gerçek-dünya
// yaklaşık değerleri, USDA + Türk gıda kompozisyonu ortalamaları.
const HIGH_FAT_INGREDIENTS: Map<string, { fatPercent: number; satPercent: number }> =
  new Map([
    ["kuyruk yağı", { fatPercent: 95, satPercent: 80 }],
    ["kuyruk yagi", { fatPercent: 95, satPercent: 80 }],
    ["tereyağı", { fatPercent: 81, satPercent: 51 }],
    ["tereyagi", { fatPercent: 81, satPercent: 51 }],
    ["zeytinyağı", { fatPercent: 100, satPercent: 14 }],
    ["zeytinyagi", { fatPercent: 100, satPercent: 14 }],
    ["zeytin yağı", { fatPercent: 100, satPercent: 14 }],
    ["ay çiçek yağı", { fatPercent: 100, satPercent: 12 }],
    ["ayciçek yağı", { fatPercent: 100, satPercent: 12 }],
    ["aycicek yagi", { fatPercent: 100, satPercent: 12 }],
    ["mısırözü yağı", { fatPercent: 100, satPercent: 13 }],
    ["misirozu yagi", { fatPercent: 100, satPercent: 13 }],
    ["hindistan cevizi yağı", { fatPercent: 100, satPercent: 87 }],
    ["susam yağı", { fatPercent: 100, satPercent: 14 }],
    ["yer fıstığı yağı", { fatPercent: 100, satPercent: 17 }],
    ["kanola yağı", { fatPercent: 100, satPercent: 7 }],
    ["sıvı yağ", { fatPercent: 100, satPercent: 14 }],
    ["sivi yag", { fatPercent: 100, satPercent: 14 }],
    ["krema", { fatPercent: 35, satPercent: 22 }],
    ["süt kreması", { fatPercent: 35, satPercent: 22 }],
    ["kaymak", { fatPercent: 60, satPercent: 38 }],
    ["badem yağı", { fatPercent: 100, satPercent: 8 }],
    ["ceviz yağı", { fatPercent: 100, satPercent: 9 }],
    ["fındık yağı", { fatPercent: 100, satPercent: 8 }],
  ]);

interface IngredientRow {
  name: string;
  amount: string;
  unit: string | null;
}

interface RecipeRow {
  id: string;
  slug: string;
  title: string;
  servingCount: number;
  averageCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  ingredients: IngredientRow[];
}

interface Anomaly {
  slug: string;
  title: string;
  type: "macro_deviation" | "high_fat_anomaly" | "missing_nutrition";
  detail: string;
  severity: "high" | "medium" | "low";
}

const MACRO_TOLERANCE_PCT = 30;
const HIGH_FAT_THRESHOLD_PCT = 50;

function parseAmountToGrams(amount: string, unit: string | null): number | null {
  if (!amount) return null;
  const cleaned = amount.replace(",", ".").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  const u = (unit ?? "").toLowerCase().trim();
  // Tipik birim → gram (kabaca, tahmin amaçlı)
  if (u === "gr" || u === "g" || u === "gram") return num;
  if (u === "kg") return num * 1000;
  if (u === "yemek kaşığı" || u === "yk") return num * 15;
  if (u === "çay kaşığı" || u === "çk" || u === "tk") return num * 5;
  if (u === "su bardağı" || u === "sb") return num * 200;
  if (u === "çay bardağı" || u === "çb") return num * 100;
  if (u === "tatlı kaşığı") return num * 10;
  if (u === "ml" || u === "cc") return num; // sıvı yağ ml ≈ gram
  if (u === "lt" || u === "litre") return num * 1000;
  if (u === "adet" || u === "tutam" || u === "diş" || u === "demet") return null;
  return null;
}

function checkMacroDeviation(r: RecipeRow): Anomaly | null {
  if (
    r.averageCalories === null ||
    r.protein === null ||
    r.carbs === null ||
    r.fat === null ||
    r.averageCalories <= 0
  ) {
    return null;
  }
  const calculated = 4 * Number(r.protein) + 4 * Number(r.carbs) + 9 * Number(r.fat);
  const diff = Math.abs(calculated - r.averageCalories);
  const tolerance = r.averageCalories * (MACRO_TOLERANCE_PCT / 100);
  if (diff <= tolerance) return null;
  const pct = Math.round((diff / r.averageCalories) * 100);
  return {
    slug: r.slug,
    title: r.title,
    type: "macro_deviation",
    detail: `4P+4C+9F=${Math.round(calculated)} vs avg ${r.averageCalories} (fark %${pct}, tol %${MACRO_TOLERANCE_PCT})`,
    severity: pct > 60 ? "high" : "medium",
  };
}

function checkHighFatAnomaly(r: RecipeRow): Anomaly | null {
  if (r.fat === null || r.fat < 0 || r.servingCount <= 0) return null;
  let totalFatGrams = 0;
  let totalSatGrams = 0;
  let matched = false;
  for (const ing of r.ingredients) {
    const lower = ing.name.toLocaleLowerCase("tr");
    let info: { fatPercent: number; satPercent: number } | undefined;
    for (const [key, val] of HIGH_FAT_INGREDIENTS.entries()) {
      if (lower.includes(key)) {
        info = val;
        break;
      }
    }
    if (!info) continue;
    matched = true;
    const grams = parseAmountToGrams(ing.amount, ing.unit);
    if (grams === null || grams <= 0) continue;
    totalFatGrams += (grams * info.fatPercent) / 100;
    totalSatGrams += (grams * info.satPercent) / 100;
  }
  if (!matched || totalFatGrams === 0) return null;
  const expectedFatPerServing = totalFatGrams / r.servingCount;
  const expectedSatPerServing = totalSatGrams / r.servingCount;
  const dbFat = Number(r.fat);
  const fatDiff = Math.abs(dbFat - expectedFatPerServing);
  const tolerance = expectedFatPerServing * (HIGH_FAT_THRESHOLD_PCT / 100);
  if (fatDiff <= tolerance) return null;
  const pct = Math.round((fatDiff / Math.max(expectedFatPerServing, 1)) * 100);
  return {
    slug: r.slug,
    title: r.title,
    type: "high_fat_anomaly",
    detail: `ingredient bazlı tahmini ${expectedFatPerServing.toFixed(1)}g (doymuş ~${expectedSatPerServing.toFixed(1)}g) vs DB ${dbFat}g/porsiyon (fark %${pct})`,
    severity: pct > 100 ? "high" : pct > 50 ? "medium" : "low",
  };
}

function checkMissingNutrition(r: RecipeRow): Anomaly | null {
  if (r.ingredients.length < 5) return null;
  const missingFields: string[] = [];
  if (r.averageCalories === null || r.averageCalories === 0) missingFields.push("kcal");
  if (r.protein === null) missingFields.push("protein");
  if (r.carbs === null) missingFields.push("carbs");
  if (r.fat === null) missingFields.push("fat");
  if (missingFields.length === 0) return null;
  return {
    slug: r.slug,
    title: r.title,
    type: "missing_nutrition",
    detail: `${r.ingredients.length} ingredient ama eksik alan: ${missingFields.join(", ")}`,
    severity: "low",
  };
}

async function main() {
  const url = process.env.DATABASE_URL!;
  if (!url) {
    console.error("DATABASE_URL yok");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      servingCount: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      ingredients: {
        select: { name: true, amount: true, unit: true },
      },
    },
  });
  console.log(`Toplam tarif: ${recipes.length}`);

  const anomalies: Anomaly[] = [];
  for (const raw of recipes) {
    const r: RecipeRow = {
      id: raw.id,
      slug: raw.slug,
      title: raw.title,
      servingCount: raw.servingCount,
      averageCalories: raw.averageCalories,
      protein: raw.protein === null ? null : Number(raw.protein),
      carbs: raw.carbs === null ? null : Number(raw.carbs),
      fat: raw.fat === null ? null : Number(raw.fat),
      ingredients: raw.ingredients,
    };
    const macro = checkMacroDeviation(r);
    if (macro) anomalies.push(macro);
    const fat = checkHighFatAnomaly(r);
    if (fat) anomalies.push(fat);
    const missing = checkMissingNutrition(r);
    if (missing) anomalies.push(missing);
  }

  const byType = anomalies.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});
  const bySeverity = anomalies.reduce<Record<string, number>>((acc, a) => {
    acc[a.severity] = (acc[a.severity] ?? 0) + 1;
    return acc;
  }, {});

  const lines: string[] = [];
  lines.push(`# Nutrition anomaly raporu`);
  lines.push("");
  lines.push(`Tarama tarihi: ${new Date().toISOString()}`);
  lines.push(`Toplam tarif: ${recipes.length}`);
  lines.push(`Anomali bulunan: ${anomalies.length}`);
  lines.push("");
  lines.push("## Tip dağılımı");
  lines.push("");
  for (const [t, n] of Object.entries(byType)) {
    lines.push(`- ${t}: ${n}`);
  }
  lines.push("");
  lines.push("## Şiddet dağılımı");
  lines.push("");
  for (const [s, n] of Object.entries(bySeverity)) {
    lines.push(`- ${s}: ${n}`);
  }
  lines.push("");

  // Top 30 high severity
  const high = anomalies.filter((a) => a.severity === "high").slice(0, 30);
  if (high.length > 0) {
    lines.push("## High severity (top 30)");
    lines.push("");
    lines.push("| Slug | Tip | Detay |");
    lines.push("|---|---|---|");
    for (const a of high) {
      lines.push(`| \`${a.slug}\` | ${a.type} | ${a.detail} |`);
    }
    lines.push("");
  }

  // Medium top 30
  const medium = anomalies.filter((a) => a.severity === "medium").slice(0, 30);
  if (medium.length > 0) {
    lines.push("## Medium severity (top 30)");
    lines.push("");
    lines.push("| Slug | Tip | Detay |");
    lines.push("|---|---|---|");
    for (const a of medium) {
      lines.push(`| \`${a.slug}\` | ${a.type} | ${a.detail} |`);
    }
    lines.push("");
  }

  // High fat anomaly özel sample (Adana Kebap benzeri)
  const fatAnomalies = anomalies.filter((a) => a.type === "high_fat_anomaly").slice(0, 20);
  if (fatAnomalies.length > 0) {
    lines.push("## High fat anomaly sample (top 20, Adana Kebap pattern)");
    lines.push("");
    lines.push("| Slug | Detay |");
    lines.push("|---|---|");
    for (const a of fatAnomalies) {
      lines.push(`| \`${a.slug}\` | ${a.detail} |`);
    }
    lines.push("");
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/nutrition-anomaly-report.md"),
    lines.join("\n"),
  );

  console.log("");
  console.log("Anomali tipleri:");
  for (const [t, n] of Object.entries(byType)) console.log(`  ${t}: ${n}`);
  console.log("Şiddet:");
  for (const [s, n] of Object.entries(bySeverity)) console.log(`  ${s}: ${n}`);
  console.log("");
  console.log(`Yazıldı: docs/nutrition-anomaly-report.md`);

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
