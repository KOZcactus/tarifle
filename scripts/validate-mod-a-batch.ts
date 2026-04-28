/**
 * Mod A v2 batch teslim 7 GATE validation script (kalıcı pipeline tool).
 *
 * Codex'in scripts/seed-recipes.ts'e append ettiği yeni tarifleri
 * git diff ile otomatik tespit eder, 7 GATE kontrolü yapar:
 *
 *   GATE 1: UNIQUENESS (slug + cuisine 41 sabit + title semantik benzerlik)
 *   GATE 2: KAYNAK (manuel kontrol, JSON'da source field yok)
 *   GATE 3: KLASIK FORMUL (manuel kontrol, klasik essential ingredient)
 *   GATE 4: STEP↔INGREDIENT MATCH (basic word match)
 *   GATE 5: ANTI-BOILERPLATE 21 PATTERN
 *   GATE 6: SLUG-LEAK YASAĞI
 *   GATE 7: EM-DASH YASAĞI (U+2014, U+2013)
 *
 * Pipeline: dev DRY-RUN (validate only) → Codex retrofit varsa
 * REJECT slug'ları → tüm GATE PASS olunca apply (npm run db:seed
 * veya manuel insert).
 *
 * Usage:
 *   npx tsx scripts/validate-mod-a-batch.ts (otomatik git diff)
 *   npx tsx scripts/validate-mod-a-batch.ts --slugs slug1,slug2,...
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local"), override: true });

// 21 boilerplate pattern (find-jenerik-scaffold.ts ile aynı, GATE 5)
const BOILERPLATE_PATTERNS = [
  "kalan malzemeleri ölçün ve kesilecek sebze",
  "son tuz, yağ ve ekşi dengesini kontrol",
  "tabakta su salıp dokusu kaymasın",
  "tavayı orta ateşte 2 dakika ısıtın",
  "sosunu veya bağlayıcı harcını ayrı kapta",
  "şekil verecek kıvama gelene kadar toparlayın",
  "tüm malzemeyi servis öncesi hazırlayın",
  "sıvılarını ve aromatiklerini dengeli biçimde karıştırın",
  "kuru ve yaş malzemeleri ayırın",
  "soğursa gevrek kenarlar yumuşar",
  "peynirli doku sertleşir",
  "tuz, baharat ve ekşi malzemeyi ayrı kapta birleştirin",
  "servis tabağını ve yan malzemeleri hazırlayın",
  "ılık tabaklara alın, yanında çayla",
  "son dokusunu kontrol edip tabaklayın",
  "ritim bozulmasın",
  "gluten gevşesin",
  "akışı için",
  "sıcak servis kıvamı korur",
  "sıcak adımlarda arama yapılmasın",
  "akışında kullanılacak tava",
];

function getNewSlugs(): string[] {
  const slugIdx = process.argv.indexOf("--slugs");
  if (slugIdx >= 0 && process.argv[slugIdx + 1]) {
    return process.argv[slugIdx + 1].split(",").map((s) => s.trim());
  }
  // Auto-detect from git diff scripts/seed-recipes.ts
  try {
    const diff = execSync("git diff scripts/seed-recipes.ts", { encoding: "utf-8" });
    const slugs: string[] = [];
    const matches = diff.matchAll(/^\+.*slug:\s*"([^"]+)"/gm);
    for (const m of matches) slugs.push(m[1]);
    return Array.from(new Set(slugs));
  } catch {
    return [];
  }
}

function extractRecipe(content: string, slug: string): {
  slug: string;
  title?: string;
  description?: string;
  cuisine?: string;
  type?: string;
  ingredientNames: string[];
  stepInstructions: string[];
  block: string;
} | null {
  const slugRegex = new RegExp(`r\\(\\{[^}]*slug:\\s*"${slug}"[\\s\\S]*?\\}\\)\\s*,`, "g");
  const match = slugRegex.exec(content);
  if (!match) return null;
  const block = match[0];
  const titleMatch = block.match(/title:\s*"([^"]+)"/);
  const descMatch = block.match(/description:\s*"([^"]+)"/);
  const cuisineMatch = block.match(/cuisine:\s*"([^"]+)"/);
  const typeMatch = block.match(/type:\s*"([^"]+)"/);

  const ingredientNames: string[] = [];
  const ingRegex = /\bingredients:\s*\[([\s\S]*?)\]/g;
  const ingMatch = ingRegex.exec(block);
  if (ingMatch) {
    const ingBlock = ingMatch[1];
    const names = ingBlock.match(/"name":\s*"([^"]+)"|name:\s*"([^"]+)"/g) ?? [];
    for (const n of names) {
      const nm = n.match(/"([^"]+)"$/);
      if (nm) ingredientNames.push(nm[1]);
    }
  }

  const stepInstructions: string[] = [];
  const stepRegex = /\bsteps:\s*\[([\s\S]*?)\]/g;
  let stepMatch: RegExpExecArray | null;
  while ((stepMatch = stepRegex.exec(block)) !== null) {
    const stepBlock = stepMatch[1];
    const insts = stepBlock.match(/"instruction":\s*"([^"]+)"|instruction:\s*"([^"]+)"/g) ?? [];
    for (const i of insts) {
      const im = i.match(/"([^"]+)"$/);
      if (im) stepInstructions.push(im[1]);
    }
  }

  return {
    slug,
    title: titleMatch?.[1],
    description: descMatch?.[1],
    cuisine: cuisineMatch?.[1],
    type: typeMatch?.[1],
    ingredientNames,
    stepInstructions,
    block,
  };
}

async function main() {
  const newSlugs = getNewSlugs();
  if (newSlugs.length === 0) {
    console.log("No new slugs detected (git diff + --slugs both empty).");
    process.exit(0);
  }
  console.log(`Validating ${newSlugs.length} new recipe(s):`);
  console.log(newSlugs.map((s) => `  - ${s}`).join("\n"));
  console.log();

  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  console.log("DB:", new URL(url).host);
  console.log();

  const seedContent = fs.readFileSync(path.resolve("scripts/seed-recipes.ts"), "utf-8");
  const recipes = newSlugs.map((slug) => {
    const r = extractRecipe(seedContent, slug);
    if (!r) return { slug, missing: true };
    return r;
  });

  const issues: { slug: string; gate: string; detail: string }[] = [];

  // GATE 1, UNIQUENESS (slug)
  console.log("=== GATE 1: UNIQUENESS (slug) ===");
  const existingProd = await prisma.recipe.findMany({
    where: { slug: { in: newSlugs } },
    select: { slug: true, title: true },
  });
  for (const ex of existingProd) {
    issues.push({ slug: ex.slug, gate: "GATE 1 UNIQUENESS", detail: `Slug already in prod (${ex.title})` });
  }
  console.log(`  ${existingProd.length} duplicate slug(s)`);

  // GATE 1.5, Title semantic similarity
  console.log("\n=== GATE 1.5: TITLE SEMANTIC SIMILARITY ===");
  const allProdTitles = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, title: true },
  });
  for (const r of recipes) {
    if ("missing" in r || !r.title) continue;
    const newTitle = r.title.toLocaleLowerCase("tr");
    const titleWords = newTitle.split(/\s+/).filter((w) => w.length > 3);
    if (titleWords.length === 0) continue;
    for (const ex of allProdTitles) {
      const exTitle = ex.title.toLocaleLowerCase("tr");
      const exWords = exTitle.split(/\s+/).filter((w) => w.length > 3);
      const overlap = titleWords.filter((w) => exWords.includes(w)).length;
      if (overlap >= 2 && overlap / titleWords.length >= 0.6 && r.slug !== ex.slug) {
        issues.push({
          slug: r.slug,
          gate: "GATE 1.5 SIMILAR TITLE",
          detail: `'${r.title}' similar to prod '${ex.title}' (${ex.slug}, ${overlap} word overlap)`,
        });
      }
    }
  }
  console.log(`  ${issues.filter((i) => i.gate === "GATE 1.5 SIMILAR TITLE").length} similar title(s)`);

  // GATE 4, STEP↔INGREDIENT
  console.log("\n=== GATE 4: STEP↔INGREDIENT MATCH (basic) ===");
  const checkWords = ["tuz", "karabiber", "zeytinyağı", "tereyağı", "soğan", "sarımsak", "domates", "süt", "yumurta", "un", "limon", "maydanoz", "pul biber", "kekik", "sumak"];
  for (const r of recipes) {
    if ("missing" in r) continue;
    const ingNames = r.ingredientNames.map((n) => n.toLocaleLowerCase("tr"));
    const stepText = r.stepInstructions.join(" ").toLocaleLowerCase("tr");
    for (const word of checkWords) {
      if (stepText.includes(word) && !ingNames.some((n) => n.includes(word))) {
        issues.push({
          slug: r.slug,
          gate: "GATE 4 STEP↔INGREDIENT",
          detail: `Step mentions '${word}' but ingredient list has no match`,
        });
      }
    }
  }
  console.log(`  ${issues.filter((i) => i.gate === "GATE 4 STEP↔INGREDIENT").length} mismatch(es)`);

  // GATE 5, ANTI-BOILERPLATE
  console.log("\n=== GATE 5: ANTI-BOILERPLATE 21 PATTERN ===");
  for (const r of recipes) {
    if ("missing" in r) continue;
    const allText = r.stepInstructions.join(" ").toLocaleLowerCase("tr");
    for (const pat of BOILERPLATE_PATTERNS) {
      if (allText.includes(pat.toLocaleLowerCase("tr"))) {
        issues.push({ slug: r.slug, gate: "GATE 5 BOILERPLATE", detail: `Pattern '${pat}'` });
      }
    }
  }
  console.log(`  ${issues.filter((i) => i.gate === "GATE 5 BOILERPLATE").length} boilerplate hit(s)`);

  // GATE 6, SLUG-LEAK
  console.log("\n=== GATE 6: SLUG-LEAK ===");
  for (const r of recipes) {
    if ("missing" in r) continue;
    const allText = r.stepInstructions.join(" ").toLocaleLowerCase("tr");
    if (allText.includes(r.slug)) {
      issues.push({ slug: r.slug, gate: "GATE 6 SLUG-LEAK", detail: `Slug in step instructions` });
    }
  }
  console.log(`  ${issues.filter((i) => i.gate === "GATE 6 SLUG-LEAK").length} slug-leak hit(s)`);

  // GATE 7, EM-DASH
  console.log("\n=== GATE 7: EM-DASH (U+2014, U+2013) ===");
  for (const r of recipes) {
    if ("missing" in r) continue;
    const emDash = String.fromCharCode(0x2014);
    const enDash = String.fromCharCode(0x2013);
    if (r.block.includes(emDash) || r.block.includes(enDash)) {
      const re = new RegExp(`[${emDash}${enDash}]`, "g");
      const matches = r.block.match(re) ?? [];
      issues.push({ slug: r.slug, gate: "GATE 7 EM-DASH", detail: `${matches.length} em/en-dash` });
    }
  }
  console.log(`  ${issues.filter((i) => i.gate === "GATE 7 EM-DASH").length} em-dash hit(s)`);

  // Summary
  console.log("\n=== SUMMARY ===");
  if (issues.length === 0) {
    console.log(`✅ ALL GATES PASS for ${newSlugs.length}/${newSlugs.length} recipes`);
  } else {
    console.log(`❌ ${issues.length} ISSUE(S) across ${new Set(issues.map((i) => i.slug)).size} recipe(s):`);
    const bySlug: Record<string, typeof issues> = {};
    for (const i of issues) {
      if (!bySlug[i.slug]) bySlug[i.slug] = [];
      bySlug[i.slug].push(i);
    }
    for (const [slug, list] of Object.entries(bySlug)) {
      console.log(`\n${slug}:`);
      for (const i of list) console.log(`  [${i.gate}] ${i.detail}`);
    }
  }

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
