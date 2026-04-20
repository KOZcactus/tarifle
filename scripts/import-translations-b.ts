/**
 * Mod B import, shallow-merge partial locale bundles into Recipe.translations.
 *
 * Companion to `scripts/import-translations.ts` (Mod A). Mod A expects a
 * full `{ title, description }` bundle per locale and overwrites the whole
 * JSON column. Mod B handles the next pass: recipes whose Mod A minimum
 * (title + description) is already live, and Codex is now filling
 * `ingredients`, `steps`, and optionally `tipNote` / `servingSuggestion`.
 *
 * Behaviour:
 *   - Every top-level locale bundle field is OPTIONAL in the JSON.
 *   - For each recipe, existing `translations.en` / `translations.de` are
 *     preserved; only the fields explicitly supplied in the JSON overwrite
 *     them. Arrays (ingredients, steps) replace wholesale, no per-item
 *     merge, because ordering + length must match the TR source.
 *   - If a field is present in the JSON but has the literal string "" or
 *     null, it is ignored (treated as "don't touch").
 *   - Integrity: ingredient array length must equal TR ingredients length;
 *     step array length must equal TR steps length. Mismatch → CRITICAL
 *     unless --force is passed.
 *
 * Usage:
 *   # Dry run (default), parses, validates, reports, does NOT write.
 *   npx tsx scripts/import-translations-b.ts --batch 12
 *
 *   # Apply on dev
 *   npx tsx scripts/import-translations-b.ts --batch 12 --apply
 *
 *   # Apply on prod (explicit)
 *   DATABASE_URL=<prod> npx tsx scripts/import-translations-b.ts --batch 12 --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

function parseBatchArg(): string {
  const eq = process.argv.find((a) => a.startsWith("--batch="));
  if (eq) return eq.split("=")[1];
  const idx = process.argv.indexOf("--batch");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  console.error("Missing --batch N (e.g. --batch 12).");
  process.exit(1);
}

const ingredientItemSchema = z.object({
  sortOrder: z.number().int().positive(),
  name: z.string().min(1).max(200),
});

const stepItemSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(3).max(1000),
  tip: z.string().min(2).max(500).optional(),
});

const localeBundleSchema = z
  .object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().min(20).max(500).optional(),
    tipNote: z.string().min(5).max(400).optional(),
    servingSuggestion: z.string().min(5).max(400).optional(),
    ingredients: z.array(ingredientItemSchema).min(1).optional(),
    steps: z.array(stepItemSchema).min(1).optional(),
  })
  .strict();

const issueSchema = z.object({
  type: z.enum([
    "ingredient-allergen-mismatch",
    "time-inconsistency",
    "vague-language",
    "composite-ingredient",
    "step-ingredient-missing",
    "calorie-anomaly",
    "other",
  ]),
  detail: z.string().min(3),
});

const translationItemSchema = z.object({
  slug: z.string().min(2).max(200),
  en: localeBundleSchema.optional(),
  de: localeBundleSchema.optional(),
  issues: z.array(issueSchema).optional(),
});

const translationsFileSchema = z.array(translationItemSchema);

type LocaleBundle = z.infer<typeof localeBundleSchema>;

/** Keep only truthy, non-empty fields, Codex may send `""` or `null` as
 *  "don't touch" marker; treat them as absent to avoid wiping existing data. */
function pruneEmpty(bundle: LocaleBundle | undefined): LocaleBundle {
  if (!bundle) return {};
  const out: LocaleBundle = {};
  if (bundle.title && bundle.title.trim()) out.title = bundle.title.trim();
  if (bundle.description && bundle.description.trim()) out.description = bundle.description.trim();
  if (bundle.tipNote && bundle.tipNote.trim()) out.tipNote = bundle.tipNote.trim();
  if (bundle.servingSuggestion && bundle.servingSuggestion.trim()) {
    out.servingSuggestion = bundle.servingSuggestion.trim();
  }
  if (Array.isArray(bundle.ingredients) && bundle.ingredients.length > 0) {
    out.ingredients = bundle.ingredients;
  }
  if (Array.isArray(bundle.steps) && bundle.steps.length > 0) {
    out.steps = bundle.steps;
  }
  return out;
}

async function main(): Promise<void> {
  if (APPLY) assertDbTarget("import-translations-b");

  const batch = parseBatchArg();
  const file = path.resolve(process.cwd(), `docs/translations-batch-${batch}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${file}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`Invalid JSON in ${file}: ${(e as Error).message}`);
    process.exit(1);
  }

  const zodResult = translationsFileSchema.safeParse(parsed);
  if (!zodResult.success) {
    console.error("Zod validation failed:");
    for (const issue of zodResult.error.issues.slice(0, 15)) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  const items = zodResult.data;
  console.log(`📥 Parsed ${items.length} items from docs/translations-batch-${batch}.json`);

  const slugs = items.map((i) => i.slug);
  const uniqueSlugs = new Set(slugs);
  if (uniqueSlugs.size !== slugs.length) {
    console.error("❌ Duplicate slugs detected, every row must be unique.");
    process.exit(1);
  }

  const dbRecipes = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      slug: true,
      title: true,
      translations: true,
      ingredients: { select: { sortOrder: true }, orderBy: { sortOrder: "asc" } },
      steps: { select: { stepNumber: true }, orderBy: { stepNumber: "asc" } },
    },
  });

  const dbBySlug = new Map(dbRecipes.map((r) => [r.slug, r]));
  const missing = slugs.filter((s) => !dbBySlug.has(s));
  if (missing.length) {
    console.error(`❌ ${missing.length} slug(s) not in DB: ${missing.slice(0, 10).join(", ")}`);
    process.exit(1);
  }

  // Integrity check: ingredient/step array lengths must match TR source.
  const critical: string[] = [];
  const warnings: string[] = [];
  for (const item of items) {
    const db = dbBySlug.get(item.slug)!;
    const trIngCount = db.ingredients.length;
    const trStepCount = db.steps.length;
    for (const [locale, bundle] of [
      ["en", item.en] as const,
      ["de", item.de] as const,
    ]) {
      const pruned = pruneEmpty(bundle);
      if (Array.isArray(pruned.ingredients) && pruned.ingredients.length !== trIngCount) {
        critical.push(
          `${item.slug} ${locale}.ingredients length=${pruned.ingredients.length} but TR has ${trIngCount}`,
        );
      }
      if (Array.isArray(pruned.steps) && pruned.steps.length !== trStepCount) {
        critical.push(
          `${item.slug} ${locale}.steps length=${pruned.steps.length} but TR has ${trStepCount}`,
        );
      }
      if (Array.isArray(pruned.ingredients)) {
        const orders = pruned.ingredients.map((i) => i.sortOrder).sort((a, b) => a - b);
        const trOrders = db.ingredients.map((i) => i.sortOrder).sort((a, b) => a - b);
        const mismatch = orders.some((o, idx) => o !== trOrders[idx]);
        if (mismatch) {
          warnings.push(
            `${item.slug} ${locale}.ingredients sortOrder set differs from TR (${orders.join(",")} vs ${trOrders.join(",")})`,
          );
        }
      }
      if (Array.isArray(pruned.steps)) {
        const nums = pruned.steps.map((s) => s.stepNumber).sort((a, b) => a - b);
        const trNums = db.steps.map((s) => s.stepNumber).sort((a, b) => a - b);
        const mismatch = nums.some((n, idx) => n !== trNums[idx]);
        if (mismatch) {
          warnings.push(
            `${item.slug} ${locale}.steps stepNumber set differs from TR (${nums.join(",")} vs ${trNums.join(",")})`,
          );
        }
      }
    }
    if (item.issues?.length) {
      warnings.push(`${item.slug} carries ${item.issues.length} issue note(s), review before apply.`);
    }
  }

  console.log(`\n🧪 Integrity: ${critical.length} CRITICAL / ${warnings.length} WARNING`);
  for (const c of critical.slice(0, 20)) console.error(`  [CRITICAL] ${c}`);
  for (const w of warnings.slice(0, 20)) console.warn(`  [WARNING]  ${w}`);

  if (critical.length > 0 && !FORCE) {
    console.error(`\nBlocked by ${critical.length} CRITICAL issue(s). Re-run with --force to override.`);
    process.exit(1);
  }

  if (!APPLY) {
    console.log("\n(dry run, re-run with --apply to write)");
    return;
  }

  console.log(`\n📝 applying ${items.length} translations (shallow merge)...`);
  let applied = 0;
  let unchanged = 0;
  const CHUNK = 50;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    await prisma.$transaction(
      async (tx) => {
        for (const item of chunk) {
          const db = dbBySlug.get(item.slug)!;
          const existing = (db.translations ?? {}) as {
            en?: LocaleBundle;
            de?: LocaleBundle;
          };
          const newEn = pruneEmpty(item.en);
          const newDe = pruneEmpty(item.de);
          const mergedEn = { ...(existing.en ?? {}), ...newEn };
          const mergedDe = { ...(existing.de ?? {}), ...newDe };
          const next = { en: mergedEn, de: mergedDe };
          const prevSerialized = JSON.stringify(existing);
          const nextSerialized = JSON.stringify(next);
          if (prevSerialized === nextSerialized) {
            unchanged++;
            continue;
          }
          await tx.recipe.update({
            where: { id: db.id },
            data: { translations: next },
          });
          applied++;
        }
      },
      { timeout: 60_000 },
    );
    console.log(`  ✅ ${Math.min(i + CHUNK, items.length)}/${items.length}`);
  }

  console.log(`\n🎉 done, applied=${applied}, unchanged=${unchanged}, total=${items.length}`);
  console.log(
    `\nNext: run \`npx tsx scripts/audit-deep.ts\` to verify nothing broke, then commit docs/translations-batch-${batch}.json + push.`,
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
