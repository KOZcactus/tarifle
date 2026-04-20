/**
 * Export recipes awaiting EN/DE translation as CSV parts. Codex Max reads
 * these parts, produces `docs/translations-batch-N.json`, then
 * `import-translations.ts` writes them to the DB.
 *
 * Only recipes with `translations IS NULL` are exported, idempotent, so
 * running again after a batch is imported just produces smaller parts.
 *
 * Split strategy (when the whole unfinished set fits a single pilot):
 *   - part 1 → pilot, 200 recipes
 *   - parts 2..N → ~300 recipes each (ceil of the remainder / 3)
 * You can force a single file with `--all`, or ask for a specific part.
 *
 *   # Produce all outstanding parts under docs/ (default)
 *   npx tsx scripts/export-recipes-for-translation.ts
 *
 *   # Just the pilot (part 0)
 *   npx tsx scripts/export-recipes-for-translation.ts --part 0
 *
 *   # Everything in one big CSV (debug / small remaining count)
 *   npx tsx scripts/export-recipes-for-translation.ts --all
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PILOT_SIZE = 200;
const FULL_PART_SIZE = 300;

function parsePartArg(): number | "all" | null {
  const raw = process.argv.find((a) => a.startsWith("--part="));
  if (raw) return parseInt(raw.split("=")[1], 10);
  const idx = process.argv.indexOf("--part");
  if (idx >= 0 && process.argv[idx + 1]) {
    return parseInt(process.argv[idx + 1], 10);
  }
  if (process.argv.includes("--all")) return "all";
  return null; // default: write all parts
}

/** RFC 4180 CSV escape, wrap in quotes, double embedded quotes. */
function csvCell(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value).replace(/\r?\n/g, " ").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADER = [
  "slug",
  "title",
  "description",
  "type",
  "cuisine",
  "difficulty",
  "prep_minutes",
  "cook_minutes",
  "total_minutes",
  "serving_count",
  "average_calories",
  "ingredients",
  "ingredient_count",
  "steps",
  "step_count",
  "allergens",
  "tags",
  "tipNote",
  "servingSuggestion",
].join(",");

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
  ].join(",");
}

function planParts(total: number): { start: number; end: number; label: string }[] {
  if (total === 0) return [];
  if (total <= PILOT_SIZE) {
    return [{ start: 0, end: total, label: "0" }];
  }
  const parts: { start: number; end: number; label: string }[] = [
    { start: 0, end: PILOT_SIZE, label: "0" },
  ];
  const remaining = total - PILOT_SIZE;
  const fullPartsCount = Math.ceil(remaining / FULL_PART_SIZE);
  for (let i = 0; i < fullPartsCount; i++) {
    const start = PILOT_SIZE + i * FULL_PART_SIZE;
    const end = Math.min(start + FULL_PART_SIZE, total);
    parts.push({ start, end, label: String(i + 1) });
  }
  return parts;
}

async function main() {
  const partArg = parsePartArg();

  // Pull every recipe with no translations yet. Deterministic slug order keeps
  // part boundaries stable across re-runs.
  const recipes = await prisma.recipe.findMany({
    // Prisma.DbNull = SQL NULL (nullable Json column). Prisma.JsonNull would
    // match rows whose JSON value is literally `null`, not what we want.
    where: { translations: { equals: Prisma.DbNull } },
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
      tags: {
        select: { tag: { select: { slug: true } } },
      },
    },
    orderBy: { slug: "asc" },
  });

  console.log(
    `Found ${recipes.length} recipes without translations (out of ${await prisma.recipe.count()} total).`,
  );

  if (recipes.length === 0) {
    console.log("Nothing to export. Everything already has translations.");
    return;
  }

  const rows: RecipeRow[] = recipes.map((r) => {
    // Full ingredient list with amount + unit + optional/group markers.
    // Format per item: "<name> <amount><unit>[ (opt)][, group]"
    // Separator is " | " so Codex can parse back and so commas inside a
    // single cell don't confuse CSV consumers once escaped.
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

    // Full step list, numbered, joined with " || " (steps contain periods
    // and commas; " || " keeps it parseable).
    const steps = r.steps
      .map((s) => `${s.stepNumber}. ${s.instruction}`)
      .join(" || ");

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
    };
  });

  const outDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Mode A: single-file `--all`
  if (partArg === "all") {
    const file = path.join(outDir, "translations-all.csv");
    const body = [HEADER, ...rows.map(toCsvLine)].join("\n") + "\n";
    fs.writeFileSync(file, body, "utf-8");
    console.log(`✅ wrote ${rows.length} rows to ${file}`);
    return;
  }

  const parts = planParts(rows.length);

  // Mode B: specific part (number)
  if (typeof partArg === "number") {
    const chosen = parts.find((p) => Number(p.label) === partArg);
    if (!chosen) {
      console.error(
        `No part ${partArg} planned. Available: ${parts.map((p) => p.label).join(", ")}`,
      );
      process.exit(1);
    }
    const slice = rows.slice(chosen.start, chosen.end);
    const file = path.join(outDir, `translations-batch-${chosen.label}.csv`);
    const body = [HEADER, ...slice.map(toCsvLine)].join("\n") + "\n";
    fs.writeFileSync(file, body, "utf-8");
    console.log(`✅ wrote ${slice.length} rows to ${file}`);
    return;
  }

  // Mode C (default): write every planned part
  for (const p of parts) {
    const slice = rows.slice(p.start, p.end);
    const file = path.join(outDir, `translations-batch-${p.label}.csv`);
    const body = [HEADER, ...slice.map(toCsvLine)].join("\n") + "\n";
    fs.writeFileSync(file, body, "utf-8");
    console.log(
      `✅ batch ${p.label}: ${slice.length} rows → ${path.relative(process.cwd(), file)}`,
    );
  }

  console.log("\nPlan:");
  for (const p of parts) {
    console.log(
      `  batch ${p.label.padStart(2)}  →  recipes ${p.start}–${p.end - 1}  (${p.end - p.start} rows)`,
    );
  }
  console.log(
    "\nCodex Max reads these CSVs, writes docs/translations-batch-N.json. Claude runs import.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
