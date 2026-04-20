/**
 * Mod B export, partial-field translation retrofit for a specific batch.
 *
 * Companion to `scripts/export-recipes-for-translation.ts` (Mod A). Mod A
 * runs on `translations IS NULL` and expects Codex to fill `title +
 * description`. Mod B runs on a **specific batch** (e.g. batch 12, whose
 * recipes already have EN/DE title+description from Mod A minimum) and
 * asks Codex to fill the remaining fields, `ingredients`, `steps`, and
 * optionally `tipNote` / `servingSuggestion`.
 *
 * Usage:
 *   # Use seed-recipes.ts BATCH N marker to pick slugs (recommended)
 *   npx tsx scripts/export-recipes-for-translation-b.ts --batch 12
 *
 *   # Use an explicit slug list
 *   npx tsx scripts/export-recipes-for-translation-b.ts --batch 12 \
 *     --slugs-file docs/batch-12-slugs.txt
 *
 * Output:
 *   docs/translations-batch-<N>.csv
 *
 * CSV columns (Mod B specific):
 *   slug, title_tr, description_tr, type, cuisine, difficulty,
 *   prep_minutes, cook_minutes, total_minutes, serving_count,
 *   average_calories, ingredients_tr (full), ingredient_count,
 *   steps_tr (full), step_count, allergens, tags, tipNote_tr,
 *   servingSuggestion_tr,
 *   en_title_current, en_description_current, en_tipNote_current,
 *   en_servingSuggestion_current, en_ingredients_present,
 *   en_steps_present,
 *   de_title_current, de_description_current, de_tipNote_current,
 *   de_servingSuggestion_current, de_ingredients_present,
 *   de_steps_present
 *
 * Codex reads this, sees which locale fields are already populated ("X_current"
 * non-empty or "X_present" = 1), and produces a JSON file filling ONLY the
 * empty fields. `scripts/import-translations-b.ts` then shallow-merges the new
 * locale bundle into `Recipe.translations`, existing fields are preserved
 * unless the JSON explicitly supplies a replacement.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function parseBatchArg(): string {
  const eq = process.argv.find((a) => a.startsWith("--batch="));
  if (eq) return eq.split("=")[1];
  const idx = process.argv.indexOf("--batch");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  console.error("Missing --batch N (e.g. --batch 12).");
  process.exit(1);
}

function parseSlugsFileArg(): string | null {
  const eq = process.argv.find((a) => a.startsWith("--slugs-file="));
  if (eq) return eq.split("=")[1];
  const idx = process.argv.indexOf("--slugs-file");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

/** Extract slugs for a specific batch from scripts/seed-recipes.ts by reading
 *  between `// ── BATCH N ──` and the next batch marker / closing `];`. */
function extractSlugsFromSeedFile(batchLabel: string): string[] {
  const seedPath = path.resolve(process.cwd(), "scripts/seed-recipes.ts");
  const text = fs.readFileSync(seedPath, "utf8");
  const lines = text.split(/\r?\n/);

  // Match lines like "// ── BATCH 12 ──" or "// BATCH 12 (..." (flexible).
  const markerRe = new RegExp(
    `^\\s*//\\s*(?:──\\s*)?BATCH\\s+${batchLabel}\\b`,
  );
  const startIdx = lines.findIndex((l) => markerRe.test(l));
  if (startIdx === -1) {
    throw new Error(
      `BATCH ${batchLabel} marker not found in scripts/seed-recipes.ts`,
    );
  }
  // End: next BATCH marker OR closing "];" (array terminator). Stop at whichever first.
  const nextMarkerRe = /^\s*\/\/\s*(?:──\s*)?BATCH\s+\d+\b/;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (nextMarkerRe.test(lines[i]) || /^\];/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  const slice = lines.slice(startIdx + 1, endIdx);
  const slugs: string[] = [];
  for (const line of slice) {
    const m = line.match(/slug:\s*"([a-z0-9][a-z0-9-]*)"/);
    if (m) slugs.push(m[1]);
  }
  return slugs;
}

function csvCell(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADER = [
  "slug",
  "title_tr",
  "description_tr",
  "type",
  "cuisine",
  "difficulty",
  "prep_minutes",
  "cook_minutes",
  "total_minutes",
  "serving_count",
  "average_calories",
  "ingredients_tr",
  "ingredient_count",
  "steps_tr",
  "step_count",
  "allergens",
  "tags",
  "tipNote_tr",
  "servingSuggestion_tr",
  "en_title_current",
  "en_description_current",
  "en_tipNote_current",
  "en_servingSuggestion_current",
  "en_ingredients_present",
  "en_steps_present",
  "de_title_current",
  "de_description_current",
  "de_tipNote_current",
  "de_servingSuggestion_current",
  "de_ingredients_present",
  "de_steps_present",
].join(",");

interface LocaleBundle {
  title?: string;
  description?: string;
  tipNote?: string;
  servingSuggestion?: string;
  ingredients?: unknown[];
  steps?: unknown[];
}

interface RecipeRow {
  slug: string;
  title: string;
  description: string;
  type: string;
  cuisine: string | null;
  difficulty: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  ingredients: string;
  ingredientCount: number;
  steps: string;
  stepCount: number;
  allergens: string;
  tags: string;
  tipNote: string | null;
  servingSuggestion: string | null;
  en: LocaleBundle;
  de: LocaleBundle;
}

function boolCell(v: boolean): string {
  return v ? "1" : "0";
}

function toCsvLine(r: RecipeRow): string {
  return [
    csvCell(r.slug),
    csvCell(r.title),
    csvCell(r.description),
    csvCell(r.type),
    csvCell(r.cuisine ?? ""),
    csvCell(r.difficulty),
    csvCell(String(r.prepMinutes)),
    csvCell(String(r.cookMinutes)),
    csvCell(String(r.totalMinutes)),
    csvCell(String(r.servingCount)),
    csvCell(r.averageCalories == null ? "" : String(r.averageCalories)),
    csvCell(r.ingredients),
    csvCell(String(r.ingredientCount)),
    csvCell(r.steps),
    csvCell(String(r.stepCount)),
    csvCell(r.allergens),
    csvCell(r.tags),
    csvCell(r.tipNote ?? ""),
    csvCell(r.servingSuggestion ?? ""),
    csvCell(r.en.title ?? ""),
    csvCell(r.en.description ?? ""),
    csvCell(r.en.tipNote ?? ""),
    csvCell(r.en.servingSuggestion ?? ""),
    boolCell(Array.isArray(r.en.ingredients) && r.en.ingredients.length > 0),
    boolCell(Array.isArray(r.en.steps) && r.en.steps.length > 0),
    csvCell(r.de.title ?? ""),
    csvCell(r.de.description ?? ""),
    csvCell(r.de.tipNote ?? ""),
    csvCell(r.de.servingSuggestion ?? ""),
    boolCell(Array.isArray(r.de.ingredients) && r.de.ingredients.length > 0),
    boolCell(Array.isArray(r.de.steps) && r.de.steps.length > 0),
  ].join(",");
}

async function main(): Promise<void> {
  const batch = parseBatchArg();
  const slugsFile = parseSlugsFileArg();

  let slugs: string[];
  if (slugsFile) {
    const content = fs.readFileSync(path.resolve(slugsFile), "utf8");
    slugs = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
    console.log(`📄 Loaded ${slugs.length} slugs from ${slugsFile}`);
  } else {
    slugs = extractSlugsFromSeedFile(batch);
    console.log(
      `🔎 Extracted ${slugs.length} slugs from scripts/seed-recipes.ts BATCH ${batch} marker`,
    );
  }

  if (slugs.length === 0) {
    console.error("No slugs resolved, aborting.");
    process.exit(1);
  }

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      title: true,
      description: true,
      type: true,
      cuisine: true,
      difficulty: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      allergens: true,
      tipNote: true,
      servingSuggestion: true,
      translations: true,
      ingredients: {
        select: {
          name: true,
          amount: true,
          unit: true,
          sortOrder: true,
          isOptional: true,
          group: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: { instruction: true, stepNumber: true },
        orderBy: { stepNumber: "asc" },
      },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  const found = new Set(recipes.map((r) => r.slug));
  const missing = slugs.filter((s) => !found.has(s));
  if (missing.length) {
    console.error(
      `⚠️  ${missing.length} slug(s) not in DB (skipping): ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? "…" : ""}`,
    );
  }

  // Stable slug order matching the input (Codex friendliness).
  const slugIndex = new Map(slugs.map((s, i) => [s, i]));
  recipes.sort((a, b) => slugIndex.get(a.slug)! - slugIndex.get(b.slug)!);

  const rows: RecipeRow[] = recipes.map((r) => {
    const ingredients = r.ingredients
      .map((i) => {
        const amt = [i.amount, i.unit].filter(Boolean).join(" ").trim();
        const flags = [
          amt ? amt : null,
          i.isOptional ? "(opsiyonel)" : null,
          i.group ? `, ${i.group}` : null,
        ]
          .filter(Boolean)
          .join(" ");
        return flags ? `${i.name} ${flags}` : i.name;
      })
      .join(" | ");

    const steps = r.steps
      .map((s) => `${s.stepNumber}. ${s.instruction}`)
      .join(" || ");

    const trans = (r.translations ?? {}) as Record<string, LocaleBundle>;
    const en = trans.en ?? {};
    const de = trans.de ?? {};

    return {
      slug: r.slug,
      title: r.title,
      description: r.description,
      type: r.type,
      cuisine: r.cuisine,
      difficulty: r.difficulty,
      prepMinutes: r.prepMinutes,
      cookMinutes: r.cookMinutes,
      totalMinutes: r.totalMinutes,
      servingCount: r.servingCount,
      averageCalories: r.averageCalories,
      ingredients,
      ingredientCount: r.ingredients.length,
      steps,
      stepCount: r.steps.length,
      allergens: r.allergens.join(","),
      tags: r.tags.map((t) => t.tag.slug).join(","),
      tipNote: r.tipNote,
      servingSuggestion: r.servingSuggestion,
      en,
      de,
    };
  });

  const outDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `translations-batch-${batch}.csv`);
  const body = [HEADER, ...rows.map(toCsvLine)].join("\n") + "\n";
  fs.writeFileSync(file, body, "utf8");
  console.log(
    `✅ wrote ${rows.length} rows to ${path.relative(process.cwd(), file)}`,
  );

  // Quick coverage stats, lets the caller eyeball how much work Mod B actually
  // has to do before handing off to Codex.
  let needsEnIngredients = 0;
  let needsDeIngredients = 0;
  let needsEnSteps = 0;
  let needsDeSteps = 0;
  let needsEnTip = 0;
  let needsDeTip = 0;
  let needsEnServ = 0;
  let needsDeServ = 0;
  for (const r of rows) {
    if (!(Array.isArray(r.en.ingredients) && r.en.ingredients.length > 0)) needsEnIngredients++;
    if (!(Array.isArray(r.de.ingredients) && r.de.ingredients.length > 0)) needsDeIngredients++;
    if (!(Array.isArray(r.en.steps) && r.en.steps.length > 0)) needsEnSteps++;
    if (!(Array.isArray(r.de.steps) && r.de.steps.length > 0)) needsDeSteps++;
    if (!r.en.tipNote) needsEnTip++;
    if (!r.de.tipNote) needsDeTip++;
    if (!r.en.servingSuggestion) needsEnServ++;
    if (!r.de.servingSuggestion) needsDeServ++;
  }
  console.log(`\nWork to do (out of ${rows.length}):`);
  console.log(`  EN ingredients missing: ${needsEnIngredients}`);
  console.log(`  EN steps missing:       ${needsEnSteps}`);
  console.log(`  EN tipNote missing:     ${needsEnTip}`);
  console.log(`  EN servingSug missing:  ${needsEnServ}`);
  console.log(`  DE ingredients missing: ${needsDeIngredients}`);
  console.log(`  DE steps missing:       ${needsDeSteps}`);
  console.log(`  DE tipNote missing:     ${needsDeTip}`);
  console.log(`  DE servingSug missing:  ${needsDeServ}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
