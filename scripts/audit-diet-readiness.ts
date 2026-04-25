/**
 * Diyet skoru hazırlık audit'i. Oturum 20 DIET_SCORE_PLAN Faz 0 adımı.
 *
 * Rapor:
 *   1. Recipe macro coverage (protein+carbs+fat dolu olan tarif sayısı)
 *   2. Ingredient coverage (unique ingredient listesi + NutritionData eşleşme)
 *   3. Top 50 unmatched ingredient (USDA mapping için öncelik)
 *   4. Her Faz 1 preset için "skorlanabilir tarif" sayısı tahmini
 *
 * Kullanım:
 *   npx tsx scripts/audit-diet-readiness.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Tarifle, Diyet Skoru Hazırlık Audit'i");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Recipe coverage
  const totalRecipes = await prisma.recipe.count({ where: { status: "PUBLISHED" } });
  const withMacro = await prisma.recipe.count({
    where: {
      status: "PUBLISHED",
      protein: { not: null },
      carbs: { not: null },
      fat: { not: null },
      averageCalories: { not: null },
    },
  });
  const withHungerBar = await prisma.recipe.count({
    where: { status: "PUBLISHED", hungerBar: { not: null } },
  });

  console.log("1. RECIPE MACRO COVERAGE");
  console.log("   Toplam published tarif:           " + totalRecipes);
  console.log(
    "   Protein+carbs+fat+kcal dolu:      " +
      withMacro +
      " (%" +
      ((withMacro / totalRecipes) * 100).toFixed(0) +
      ")",
  );
  console.log(
    "   Hunger bar dolu:                  " +
      withHungerBar +
      " (%" +
      ((withHungerBar / totalRecipes) * 100).toFixed(0) +
      ")",
  );
  console.log("");

  // 2. Ingredient coverage
  const uniqIng = (await prisma.$queryRaw`
    SELECT COUNT(DISTINCT LOWER(name))::int AS c FROM recipe_ingredients
  `) as { c: number }[];
  const totalIng = await prisma.recipeIngredient.count();
  const nutritionRows = await prisma.nutritionData.count();
  const matched = (await prisma.$queryRaw`
    SELECT COUNT(DISTINCT LOWER(ri.name))::int AS c
    FROM recipe_ingredients ri
    INNER JOIN nutrition_data nd ON LOWER(nd.name) = LOWER(ri.name)
  `) as { c: number }[];

  console.log("2. INGREDIENT COVERAGE");
  console.log("   Toplam RecipeIngredient rows:     " + totalIng);
  console.log("   Unique ingredient adları (lower): " + uniqIng[0].c);
  console.log("   NutritionData tablosundaki row:   " + nutritionRows);
  console.log(
    "   Eşleşen unique ingredient:        " +
      matched[0].c +
      " (%" +
      ((matched[0].c / uniqIng[0].c) * 100).toFixed(0) +
      ")",
  );
  console.log("");

  // 3. Top 50 unmatched ingredients (ordered by frequency)
  const unmatched = (await prisma.$queryRaw`
    SELECT LOWER(ri.name) AS name, COUNT(*)::int AS freq
    FROM recipe_ingredients ri
    LEFT JOIN nutrition_data nd ON LOWER(nd.name) = LOWER(ri.name)
    WHERE nd.id IS NULL
    GROUP BY LOWER(ri.name)
    ORDER BY freq DESC
    LIMIT 50
  `) as { name: string; freq: number }[];

  console.log("3. TOP 50 UNMATCHED INGREDIENTS (USDA mapping öncelik)");
  const totalUnmatchedCount = unmatched.reduce((a, b) => a + b.freq, 0);
  console.log("   Top 50 toplam usage:              " + totalUnmatchedCount + " row");
  unmatched.slice(0, 30).forEach((r, i) => {
    const pos = String(i + 1).padStart(2, " ");
    const freq = String(r.freq).padStart(4, " ");
    console.log("   " + pos + ". " + freq + "x  " + r.name);
  });
  if (unmatched.length > 30) {
    console.log("   ... (" + (unmatched.length - 30) + " daha, audit log'a full liste)");
  }
  console.log("");

  // 4. Faz 1 preset'leri için skorlanabilir tarif tahmini
  console.log("4. FAZ 1 PRESET'LERI, SKORLANABILIR TARIF TAHMINI");
  console.log("   (Mevcut macro verisi ile hesaplanacak, doğru sonuç vereceği tahmin)");
  console.log("");

  // Dengeli: makro balanced (%15-25 protein / %45-55 carbs / %25-35 fat)
  // Yaklaşık hesap için prisma aggregation kullanalım
  const recipes = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      protein: { not: null },
      carbs: { not: null },
      fat: { not: null },
      averageCalories: { not: null, gt: 0 },
    },
    select: {
      id: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      hungerBar: true,
      tags: {
        select: { tag: { select: { slug: true } } },
      },
    },
  });

  let dengeliHigh = 0,
    yuksekProteinHigh = 0,
    dusukKaloriHigh = 0,
    vejetaryenHigh = 0,
    veganHigh = 0;

  for (const r of recipes) {
    const kcal = r.averageCalories ?? 0;
    const p = Number(r.protein ?? 0);
    const c = Number(r.carbs ?? 0);
    const f = Number(r.fat ?? 0);
    const totalMacroKcal = p * 4 + c * 4 + f * 9;
    if (totalMacroKcal < 100) continue; // skip if too small

    const pPct = (p * 4) / totalMacroKcal;
    const cPct = (c * 4) / totalMacroKcal;
    const fPct = (f * 9) / totalMacroKcal;

    const isVegetarian = r.tags.some(
      (t) => t.tag.slug === "vejetaryen" || t.tag.slug === "vegetarian",
    );
    const isVegan = r.tags.some((t) => t.tag.slug === "vegan");

    // Dengeli: makro ratio balanced + kcal 350-650
    if (pPct >= 0.13 && pPct <= 0.3 && cPct >= 0.4 && cPct <= 0.6 && fPct >= 0.2 && fPct <= 0.4) {
      if (kcal >= 300 && kcal <= 700) dengeliHigh++;
    }
    // Yüksek Protein: protein ≥25g veya p% ≥ 30
    if (p >= 25 || pPct >= 0.3) yuksekProteinHigh++;
    // Düşük Kalori: kcal ≤ 400
    if (kcal <= 400) dusukKaloriHigh++;
    // Vejetaryen dengeli: vegetarian tag + protein ≥15
    if ((isVegetarian || isVegan) && p >= 15) vejetaryenHigh++;
    // Vegan dengeli: vegan tag + protein ≥12
    if (isVegan && p >= 12) veganHigh++;
  }

  const fmt = (n: number) =>
    n.toString().padStart(5, " ") + " (%" + ((n / recipes.length) * 100).toFixed(0) + ")";
  console.log("   Dengeli Beslenme (80+ skor tahmini):      " + fmt(dengeliHigh));
  console.log("   Yüksek Protein (80+ skor tahmini):        " + fmt(yuksekProteinHigh));
  console.log("   Düşük Kalori (80+ skor tahmini):          " + fmt(dusukKaloriHigh));
  console.log("   Vejetaryen Dengeli (80+ skor tahmini):    " + fmt(vejetaryenHigh));
  console.log("   Vegan Dengeli (80+ skor tahmini):         " + fmt(veganHigh));
  console.log("");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Audit tamamlandı. DIET_SCORE_PLAN güncelleme referansı.");
  console.log("═══════════════════════════════════════════════════════════");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
