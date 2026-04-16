/**
 * Database quality audit for Tarifle recipe platform.
 *
 * Connects to the production Neon PostgreSQL database and checks for
 * data quality issues across 13 categories: isFeatured ratio, nutrition
 * gaps, tipNote/servingSuggestion coverage, cuisine coverage, allergen
 * consistency, tag distribution, description length, step quality,
 * ingredient quality, near-duplicate slugs, category distribution,
 * and emoji coverage.
 *
 * Usage:
 *   npx tsx scripts/audit-db-quality.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Helpers ──────────────────────────────────────────────

type Severity = "CRITICAL" | "WARNING" | "INFO";

interface Finding {
  severity: Severity;
  message: string;
}

const findings: Finding[] = [];

function report(severity: Severity, message: string): void {
  findings.push({ severity, message });
}

function header(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

function pct(count: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((count / total) * 100).toFixed(1)}%`;
}

// Levenshtein distance for near-duplicate slug detection
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// ── Main audit ───────────────────────────────────────────

async function main(): Promise<void> {
  const totalRecipes = await prisma.recipe.count();
  console.log(`\nTarifle Database Quality Audit`);
  console.log(`Total recipes: ${totalRecipes}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // ─── 1. isFeatured ratio ──────────────────────────────
  header("1. isFeatured Ratio");
  const featuredCount = await prisma.recipe.count({
    where: { isFeatured: true },
  });
  const featuredPct = (featuredCount / totalRecipes) * 100;
  console.log(`  Featured: ${featuredCount} / ${totalRecipes} (${featuredPct.toFixed(1)}%)`);
  console.log(`  Target:   10-15% (${Math.round(totalRecipes * 0.1)}-${Math.round(totalRecipes * 0.15)})`);

  if (featuredPct < 5) {
    report("WARNING", `isFeatured too low: ${featuredPct.toFixed(1)}% (target 10-15%)`);
  } else if (featuredPct > 25) {
    report("WARNING", `isFeatured too high: ${featuredPct.toFixed(1)}% (target 10-15%)`);
  } else if (featuredPct < 10 || featuredPct > 15) {
    report("INFO", `isFeatured slightly off target: ${featuredPct.toFixed(1)}% (target 10-15%)`);
  } else {
    report("INFO", `isFeatured within target range: ${featuredPct.toFixed(1)}%`);
  }

  // ─── 2. Nutrition data gaps ───────────────────────────
  header("2. Nutrition Data Gaps");
  const nullCalories = await prisma.recipe.count({
    where: { averageCalories: null },
  });
  const nullAllMacros = await prisma.recipe.count({
    where: {
      protein: null,
      carbs: null,
      fat: null,
    },
  });
  console.log(`  Null averageCalories: ${nullCalories} / ${totalRecipes} (${pct(nullCalories, totalRecipes)})`);
  console.log(`  Null protein+carbs+fat: ${nullAllMacros} / ${totalRecipes} (${pct(nullAllMacros, totalRecipes)})`);

  if (nullCalories > totalRecipes * 0.5) {
    report("WARNING", `More than half of recipes lack calorie data: ${nullCalories}/${totalRecipes}`);
  } else {
    report("INFO", `Nutrition gaps: ${nullCalories} recipes without calories`);
  }

  // ─── 3. tipNote coverage ──────────────────────────────
  header("3. tipNote Coverage");
  const nullTip = await prisma.recipe.count({ where: { tipNote: null } });
  const hasTip = totalRecipes - nullTip;
  console.log(`  With tipNote:    ${hasTip} (${pct(hasTip, totalRecipes)})`);
  console.log(`  Without tipNote: ${nullTip} (${pct(nullTip, totalRecipes)})`);

  if (nullTip > totalRecipes * 0.3) {
    report("WARNING", `${pct(nullTip, totalRecipes)} recipes lack tipNote`);
  } else {
    report("INFO", `tipNote coverage: ${pct(hasTip, totalRecipes)}`);
  }

  // ─── 4. servingSuggestion coverage ────────────────────
  header("4. servingSuggestion Coverage");
  const nullServing = await prisma.recipe.count({
    where: { servingSuggestion: null },
  });
  const hasServing = totalRecipes - nullServing;
  console.log(`  With servingSuggestion:    ${hasServing} (${pct(hasServing, totalRecipes)})`);
  console.log(`  Without servingSuggestion: ${nullServing} (${pct(nullServing, totalRecipes)})`);

  if (nullServing > totalRecipes * 0.3) {
    report("WARNING", `${pct(nullServing, totalRecipes)} recipes lack servingSuggestion`);
  } else {
    report("INFO", `servingSuggestion coverage: ${pct(hasServing, totalRecipes)}`);
  }

  // ─── 5. Cuisine coverage ──────────────────────────────
  header("5. Cuisine Coverage");
  const nullCuisine = await prisma.recipe.count({
    where: { cuisine: null },
  });
  console.log(`  Null cuisine: ${nullCuisine}`);

  if (nullCuisine > 0) {
    report("CRITICAL", `${nullCuisine} recipes still have NULL cuisine`);
  } else {
    report("INFO", "All recipes have cuisine assigned");
  }

  const cuisineGroups = await prisma.recipe.groupBy({
    by: ["cuisine"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  console.log("\n  Cuisine distribution:");
  for (const g of cuisineGroups) {
    console.log(`    ${(g.cuisine ?? "NULL").padEnd(8)} ${String(g._count.id).padStart(4)} (${pct(g._count.id, totalRecipes)})`);
  }

  // ─── 6. Allergen consistency ──────────────────────────
  header("6. Allergen Consistency");
  // Prisma: allergens is an enum array; empty = [] which is `equals: []`
  const emptyAllergens = await prisma.recipe.count({
    where: { allergens: { equals: [] } },
  });
  console.log(`  Recipes with empty allergens []: ${emptyAllergens} / ${totalRecipes} (${pct(emptyAllergens, totalRecipes)})`);

  if (emptyAllergens > totalRecipes * 0.3) {
    report("WARNING", `${emptyAllergens} recipes have empty allergens array`);
  } else {
    report("INFO", `${emptyAllergens} recipes have empty allergens`);
  }

  // Find suspicious: recipes with [] allergens that contain flour/milk/egg keywords in ingredients
  const suspiciousAllergen = await prisma.recipe.findMany({
    where: {
      allergens: { equals: [] },
      ingredients: {
        some: {
          OR: [
            { name: { contains: "un", mode: "insensitive" } },
            { name: { contains: "süt", mode: "insensitive" } },
            { name: { contains: "yumurta", mode: "insensitive" } },
          ],
        },
      },
    },
    select: {
      title: true,
      slug: true,
      ingredients: {
        select: { name: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    take: 10,
  });

  if (suspiciousAllergen.length > 0) {
    console.log(`\n  Suspicious: [] allergens but flour/milk/egg in ingredients (showing up to 10):`);
    for (const r of suspiciousAllergen) {
      const matchingIngredients = r.ingredients
        .filter((i) => {
          const lower = i.name.toLowerCase();
          return lower.includes("un") || lower.includes("süt") || lower.includes("yumurta");
        })
        .map((i) => i.name);
      console.log(`    - ${r.title} [${r.slug}]`);
      console.log(`      Matching: ${matchingIngredients.join(", ")}`);
    }
    report(
      "WARNING",
      `${suspiciousAllergen.length}+ recipes with [] allergens contain flour/milk/egg ingredients — may need allergen tags`
    );
  }

  // ─── 7. Tag coverage ─────────────────────────────────
  header("7. Tag Coverage");
  // Use raw query to count tags per recipe efficiently
  const tagCounts: Array<{ tag_count: bigint; recipe_count: bigint }> =
    await prisma.$queryRaw`
      SELECT
        COALESCE(rt.tag_count, 0) AS tag_count,
        COUNT(*) AS recipe_count
      FROM recipes r
      LEFT JOIN (
        SELECT "recipeId", COUNT(*) AS tag_count
        FROM recipe_tags
        GROUP BY "recipeId"
      ) rt ON rt."recipeId" = r.id
      GROUP BY COALESCE(rt.tag_count, 0)
      ORDER BY tag_count
    `;

  let zeroTags = 0;
  let oneToTwo = 0;
  let threeToFive = 0;
  let sixPlus = 0;

  console.log("  Tags per recipe distribution:");
  for (const row of tagCounts) {
    const tc = Number(row.tag_count);
    const rc = Number(row.recipe_count);
    console.log(`    ${tc} tags: ${rc} recipes`);
    if (tc === 0) zeroTags = rc;
    else if (tc <= 2) oneToTwo += rc;
    else if (tc <= 5) threeToFive += rc;
    else sixPlus += rc;
  }

  console.log(`\n  Summary: 0 tags=${zeroTags}, 1-2=${oneToTwo}, 3-5=${threeToFive}, 6+=${sixPlus}`);

  if (zeroTags > 0) {
    report("WARNING", `${zeroTags} recipes have 0 tags`);
  } else {
    report("INFO", "All recipes have at least 1 tag");
  }

  // ─── 8. Empty/short descriptions ─────────────────────
  header("8. Description Quality");
  const shortDescs: Array<{ id: string; title: string; slug: string; description: string }> =
    await prisma.$queryRaw`
      SELECT id, title, slug, description
      FROM recipes
      WHERE LENGTH(description) < 30
      ORDER BY LENGTH(description)
      LIMIT 10
    `;

  console.log(`  Recipes with description < 30 chars: ${shortDescs.length}${shortDescs.length === 10 ? "+" : ""}`);
  if (shortDescs.length > 0) {
    for (const r of shortDescs) {
      console.log(`    - [${r.slug}] (${r.description.length} chars): "${r.description}"`);
    }
    report("WARNING", `${shortDescs.length}+ recipes have very short descriptions (< 30 chars)`);
  } else {
    report("INFO", "All descriptions are 30+ characters");
  }

  // ─── 9. Step quality ──────────────────────────────────
  header("9. Step Quality");
  // Recipes with only 1-2 steps
  const fewSteps: Array<{ title: string; slug: string; step_count: bigint }> =
    await prisma.$queryRaw`
      SELECT r.title, r.slug, COUNT(s.id) AS step_count
      FROM recipes r
      LEFT JOIN recipe_steps s ON s."recipeId" = r.id
      GROUP BY r.id, r.title, r.slug
      HAVING COUNT(s.id) <= 2
      ORDER BY COUNT(s.id)
    `;

  console.log(`  Recipes with <= 2 steps: ${fewSteps.length}`);
  if (fewSteps.length > 0) {
    for (const r of fewSteps.slice(0, 5)) {
      console.log(`    - ${r.title} [${r.slug}]: ${Number(r.step_count)} steps`);
    }
    if (fewSteps.length > 5) console.log(`    ... and ${fewSteps.length - 5} more`);
    report("WARNING", `${fewSteps.length} recipes have only 1-2 steps`);
  } else {
    report("INFO", "All recipes have 3+ steps");
  }

  // Steps with very short instructions
  const shortSteps: Array<{ title: string; slug: string; step_number: number; instruction: string }> =
    await prisma.$queryRaw`
      SELECT r.title, r.slug, s."stepNumber" AS step_number, s.instruction
      FROM recipe_steps s
      JOIN recipes r ON r.id = s."recipeId"
      WHERE LENGTH(s.instruction) < 20
      ORDER BY LENGTH(s.instruction)
      LIMIT 10
    `;

  console.log(`\n  Steps with instruction < 20 chars: ${shortSteps.length}${shortSteps.length === 10 ? "+" : ""}`);
  if (shortSteps.length > 0) {
    for (const s of shortSteps) {
      console.log(`    - [${s.slug}] step ${s.step_number}: "${s.instruction}"`);
    }
    report("WARNING", `${shortSteps.length}+ steps have very short instructions (< 20 chars)`);
  } else {
    report("INFO", "All step instructions are 20+ characters");
  }

  // ─── 10. Ingredient quality ───────────────────────────
  header("10. Ingredient Quality");
  // Recipes with only 1-2 ingredients
  const fewIngredients: Array<{ title: string; slug: string; ing_count: bigint }> =
    await prisma.$queryRaw`
      SELECT r.title, r.slug, COUNT(i.id) AS ing_count
      FROM recipes r
      LEFT JOIN recipe_ingredients i ON i."recipeId" = r.id
      GROUP BY r.id, r.title, r.slug
      HAVING COUNT(i.id) <= 2
      ORDER BY COUNT(i.id)
    `;

  console.log(`  Recipes with <= 2 ingredients: ${fewIngredients.length}`);
  if (fewIngredients.length > 0) {
    for (const r of fewIngredients.slice(0, 5)) {
      console.log(`    - ${r.title} [${r.slug}]: ${Number(r.ing_count)} ingredients`);
    }
    if (fewIngredients.length > 5)
      console.log(`    ... and ${fewIngredients.length - 5} more`);
    report("WARNING", `${fewIngredients.length} recipes have only 1-2 ingredients`);
  } else {
    report("INFO", "All recipes have 3+ ingredients");
  }

  // Ingredients with null/empty unit
  const nullUnit = await prisma.recipeIngredient.count({
    where: {
      OR: [{ unit: null }, { unit: "" }],
    },
  });
  const totalIngredients = await prisma.recipeIngredient.count();
  console.log(`  Ingredients with null/empty unit: ${nullUnit} / ${totalIngredients} (${pct(nullUnit, totalIngredients)})`);
  report("INFO", `${nullUnit} ingredients have null/empty unit (${pct(nullUnit, totalIngredients)})`);

  // ─── 11. Near-duplicate slugs ─────────────────────────
  header("11. Near-Duplicate Slugs");
  const allSlugs: Array<{ slug: string; title: string }> = await prisma.recipe.findMany({
    select: { slug: true, title: true },
    orderBy: { slug: "asc" },
  });

  const nearDupes: Array<{ slugA: string; slugB: string; distance: number }> = [];

  // O(n^2) but with 706 recipes this is ~250k comparisons — fast enough
  for (let i = 0; i < allSlugs.length; i++) {
    for (let j = i + 1; j < allSlugs.length; j++) {
      const a = allSlugs[i].slug;
      const b = allSlugs[j].slug;
      // Skip very different length slugs to speed up
      if (Math.abs(a.length - b.length) > 2) continue;
      const dist = levenshtein(a, b);
      if (dist <= 2 && dist > 0) {
        nearDupes.push({ slugA: a, slugB: b, distance: dist });
      }
    }
  }

  console.log(`  Slug pairs differing by 1-2 chars: ${nearDupes.length}`);
  if (nearDupes.length > 0) {
    for (const d of nearDupes.slice(0, 15)) {
      console.log(`    - "${d.slugA}" <-> "${d.slugB}" (distance: ${d.distance})`);
    }
    if (nearDupes.length > 15) console.log(`    ... and ${nearDupes.length - 15} more`);
    report("WARNING", `${nearDupes.length} near-duplicate slug pairs found (Levenshtein <= 2)`);
  } else {
    report("INFO", "No near-duplicate slugs found");
  }

  // ─── 12. Category distribution ────────────────────────
  header("12. Category Distribution");
  const categoryDist = await prisma.recipe.groupBy({
    by: ["categoryId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Fetch category names
  const categoryIds = categoryDist.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, slug: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  let thinCategories = 0;
  console.log("  Recipes per category:");
  for (const g of categoryDist) {
    const cat = catMap.get(g.categoryId);
    const name = cat ? cat.name : g.categoryId;
    const flag = g._count.id < 5 ? " <-- LOW" : "";
    console.log(`    ${name.padEnd(30)} ${String(g._count.id).padStart(4)}${flag}`);
    if (g._count.id < 5) thinCategories++;
  }

  if (thinCategories > 0) {
    report("WARNING", `${thinCategories} categories have fewer than 5 recipes`);
  } else {
    report("INFO", "All categories have 5+ recipes");
  }

  // ─── 13. Emoji coverage ───────────────────────────────
  header("13. Emoji Coverage");
  const nullEmoji = await prisma.recipe.count({
    where: { emoji: null },
  });
  console.log(`  Recipes with null emoji: ${nullEmoji} / ${totalRecipes} (${pct(nullEmoji, totalRecipes)})`);

  if (nullEmoji > 0) {
    report("CRITICAL", `${nullEmoji} recipes have null emoji`);
    const sampleNullEmoji = await prisma.recipe.findMany({
      where: { emoji: null },
      select: { title: true, slug: true },
      take: 5,
    });
    for (const r of sampleNullEmoji) {
      console.log(`    - ${r.title} [${r.slug}]`);
    }
  } else {
    report("INFO", "All recipes have emoji assigned");
  }

  // ─── Summary Report ───────────────────────────────────
  header("AUDIT SUMMARY");

  const criticals = findings.filter((f) => f.severity === "CRITICAL");
  const warnings = findings.filter((f) => f.severity === "WARNING");
  const infos = findings.filter((f) => f.severity === "INFO");

  if (criticals.length > 0) {
    console.log("\n  CRITICAL:");
    for (const f of criticals) {
      console.log(`    [CRITICAL] ${f.message}`);
    }
  }
  if (warnings.length > 0) {
    console.log("\n  WARNINGS:");
    for (const f of warnings) {
      console.log(`    [WARNING]  ${f.message}`);
    }
  }
  if (infos.length > 0) {
    console.log("\n  INFO:");
    for (const f of infos) {
      console.log(`    [INFO]     ${f.message}`);
    }
  }

  console.log(`\n  Totals: ${criticals.length} CRITICAL, ${warnings.length} WARNING, ${infos.length} INFO`);
  console.log("");
}

main()
  .catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
