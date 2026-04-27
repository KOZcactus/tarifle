/**
 * Mod K (Tarif Kontrol) apply pipeline. verify PASS sonrasi onaylanan
 * correction'lari DB'ye uygular.
 *
 * Default: tum CORRECTION verdict'leri uygular (MAJOR_ISSUE manuel
 * review gerek; --apply-major flag'iyle dahil edilebilir). PASS
 * dokunulmaz.
 *
 * Cherry-pick: --slugs slug1,slug2 ile sadece bazi tariflere uygula.
 *
 * Her tarif icin AuditLog action="MOD_K_APPLY" metadata: slug +
 * verdict + corrections + sources + confidence + reason. Idempotent:
 * eger correction'in degeri zaten DB'de aynisi varsa skip.
 *
 * Usage:
 *   npx tsx scripts/apply-mod-k-batch.ts                         # dry-run, tum batch'ler
 *   npx tsx scripts/apply-mod-k-batch.ts --batch 1 --apply       # dev
 *   npx tsx scripts/apply-mod-k-batch.ts --batch 1 --env prod --apply --confirm-prod
 *   npx tsx scripts/apply-mod-k-batch.ts --batch 1 --slugs carbonara,moussaka --apply
 *   npx tsx scripts/apply-mod-k-batch.ts --batch 1 --apply-major --apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({
  path: path.resolve(__dirname2, "..", envFile),
  override: true,
});

interface ModKEntry {
  slug: string;
  verdict: "PASS" | "CORRECTION" | "MAJOR_ISSUE";
  issues?: string[];
  corrections?: {
    description?: string;
    cuisine?: string;
    ingredients_add?: Array<{ name: string; amount: string; unit: string; group?: string }>;
    ingredients_remove?: string[];
    ingredients_amount_change?: Array<{ name: string; newAmount: string; newUnit?: string }>;
    steps_replace?: Array<{ stepNumber: number; instruction: string; timerSeconds?: number | null }>;
    tipNote?: string;
    servingSuggestion?: string;
    prepMinutes?: number;
    cookMinutes?: number;
    totalMinutes?: number;
    servingCount?: number;
    averageCalories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    tags_add?: string[];
    tags_remove?: string[];
    allergens_add?: string[];
    allergens_remove?: string[];
  };
  sources?: string[];
  confidence?: "high" | "medium" | "low";
  reason?: string;
}

// Sub-batch keys: "1a", "1b" ...
function parseBatchArg(): string[] | null {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1]
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^\d+[ab]$/.test(s));
}

function parseSlugsArg(): Set<string> | null {
  const idx = process.argv.indexOf("--slugs");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return new Set(process.argv[idx + 1].split(",").map((s) => s.trim()).filter(Boolean));
}

function discoverBatchFiles(filter: string[] | null): string[] {
  const docsDir = path.resolve(process.cwd(), "docs");
  const all = fs
    .readdirSync(docsDir)
    .filter((f) => /^mod-k-batch-\d+[ab]\.json$/.test(f))
    .sort();
  if (!filter) return all.map((f) => path.join(docsDir, f));
  const set = new Set(filter);
  return all
    .filter((f) => {
      const m = f.match(/^mod-k-batch-(\d+[ab])\.json$/);
      return m && set.has(m[1]);
    })
    .map((f) => path.join(docsDir, f));
}

async function main() {
  assertDbTarget("apply-mod-k-batch");
  const APPLY = process.argv.includes("--apply");
  const APPLY_MAJOR = process.argv.includes("--apply-major");
  const SLUGS_FILTER = parseSlugsArg();

  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`DB: ${new URL(url).host}`);
  if (SLUGS_FILTER) console.log(`Slugs filter: ${[...SLUGS_FILTER].join(", ")}`);
  if (APPLY_MAJOR) console.log(`MAJOR_ISSUE dahil`);

  const filter = parseBatchArg();
  const files = discoverBatchFiles(filter);
  if (files.length === 0) {
    console.error("docs/mod-k-batch-N.json bulunamadi");
    await prisma.$disconnect();
    process.exit(1);
  }

  const all: ModKEntry[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf-8"));
    if (!Array.isArray(data)) continue;
    for (const e of data) all.push(e as ModKEntry);
  }

  const applyable = all.filter((e) => {
    if (e.verdict === "PASS") return false;
    if (e.verdict === "MAJOR_ISSUE" && !APPLY_MAJOR) return false;
    if (SLUGS_FILTER && !SLUGS_FILTER.has(e.slug)) return false;
    return e.corrections && Object.keys(e.corrections).length > 0;
  });
  console.log(`Toplam entry: ${all.length}, applyable: ${applyable.length}`);
  console.log("");

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const e of applyable) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: e.slug },
      select: {
        id: true,
        slug: true,
        description: true,
        cuisine: true,
        tipNote: true,
        servingSuggestion: true,
        prepMinutes: true,
        cookMinutes: true,
        totalMinutes: true,
        servingCount: true,
        averageCalories: true,
        protein: true,
        carbs: true,
        fat: true,
        tags: { select: { tag: { select: { slug: true } } } },
        allergens: true,
        status: true,
        ingredients: { select: { id: true, name: true, amount: true, unit: true, sortOrder: true } },
      },
    });
    if (!recipe || recipe.status !== "PUBLISHED") {
      console.log(`NOT_FOUND_OR_STATUS ${e.slug}`);
      notFound++;
      continue;
    }

    const c = e.corrections!;
    const updateData: Record<string, unknown> = {};

    let hasChange = false;
    if (c.description && c.description !== recipe.description) {
      updateData.description = c.description;
      hasChange = true;
    }
    if (c.cuisine !== undefined && c.cuisine !== recipe.cuisine) {
      updateData.cuisine = c.cuisine;
      hasChange = true;
    }
    if (c.tipNote && c.tipNote !== recipe.tipNote) {
      updateData.tipNote = c.tipNote;
      hasChange = true;
    }
    if (c.servingSuggestion && c.servingSuggestion !== recipe.servingSuggestion) {
      updateData.servingSuggestion = c.servingSuggestion;
      hasChange = true;
    }
    if (c.prepMinutes !== undefined && c.prepMinutes !== recipe.prepMinutes) {
      updateData.prepMinutes = c.prepMinutes;
      hasChange = true;
    }
    if (c.cookMinutes !== undefined && c.cookMinutes !== recipe.cookMinutes) {
      updateData.cookMinutes = c.cookMinutes;
      hasChange = true;
    }
    if (c.totalMinutes !== undefined && c.totalMinutes !== recipe.totalMinutes) {
      updateData.totalMinutes = c.totalMinutes;
      hasChange = true;
    }
    if (c.servingCount !== undefined && c.servingCount !== recipe.servingCount) {
      updateData.servingCount = c.servingCount;
      hasChange = true;
    }
    if (c.averageCalories !== undefined && c.averageCalories !== recipe.averageCalories) {
      updateData.averageCalories = c.averageCalories;
      hasChange = true;
    }
    // Decimal alanlar Prisma'dan Decimal donerken, comparison icin Number()
    const currentProtein = recipe.protein === null ? null : Number(recipe.protein);
    const currentCarbs = recipe.carbs === null ? null : Number(recipe.carbs);
    const currentFat = recipe.fat === null ? null : Number(recipe.fat);
    if (c.protein !== undefined && c.protein !== currentProtein) {
      updateData.protein = c.protein;
      hasChange = true;
    }
    if (c.carbs !== undefined && c.carbs !== currentCarbs) {
      updateData.carbs = c.carbs;
      hasChange = true;
    }
    if (c.fat !== undefined && c.fat !== currentFat) {
      updateData.fat = c.fat;
      hasChange = true;
    }

    // Tags relation (RecipeTag join table) + allergens (enum array)
    const currentTagSlugs = new Set(recipe.tags.map((t) => t.tag.slug));
    const currentAllergens = new Set((recipe.allergens ?? []) as string[]);
    const tagsAdd = c.tags_add ?? [];
    const tagsRemove = c.tags_remove ?? [];
    const allergensAdd = c.allergens_add ?? [];
    const allergensRemove = c.allergens_remove ?? [];
    let tagsChanged = false;
    let allergensChanged = false;
    const finalTagSlugs = new Set(currentTagSlugs);
    for (const t of tagsAdd) if (!finalTagSlugs.has(t)) { finalTagSlugs.add(t); tagsChanged = true; }
    for (const t of tagsRemove) if (finalTagSlugs.has(t)) { finalTagSlugs.delete(t); tagsChanged = true; }
    for (const a of allergensAdd) if (!currentAllergens.has(a)) { currentAllergens.add(a); allergensChanged = true; }
    for (const a of allergensRemove) if (currentAllergens.has(a)) { currentAllergens.delete(a); allergensChanged = true; }
    if (allergensChanged) {
      updateData.allergens = [...currentAllergens];
      hasChange = true;
    }
    if (tagsChanged) {
      hasChange = true;
      // Tags update transaction icinde RecipeTag.create/delete olarak yapilir
    }

    const ingsAdd = c.ingredients_add ?? [];
    const ingsRemove = c.ingredients_remove ?? [];
    const ingsAmountChange = c.ingredients_amount_change ?? [];
    const stepsReplace = c.steps_replace ?? [];

    if (!hasChange && ingsAdd.length === 0 && ingsRemove.length === 0 && ingsAmountChange.length === 0 && stepsReplace.length === 0) {
      console.log(`SKIP ${e.slug} (zaten guncel)`);
      skipped++;
      continue;
    }

    if (!APPLY) {
      const summary: string[] = [];
      if (updateData.description) summary.push("description");
      if (updateData.cuisine) summary.push(`cuisine ${recipe.cuisine}->${updateData.cuisine}`);
      if (updateData.tipNote) summary.push("tipNote");
      if (updateData.servingSuggestion) summary.push("servingSuggestion");
      if (updateData.prepMinutes !== undefined) summary.push(`prep ${recipe.prepMinutes}->${updateData.prepMinutes}`);
      if (updateData.cookMinutes !== undefined) summary.push(`cook ${recipe.cookMinutes}->${updateData.cookMinutes}`);
      if (updateData.totalMinutes !== undefined) summary.push(`total ${recipe.totalMinutes}->${updateData.totalMinutes}`);
      if (updateData.servingCount !== undefined) summary.push(`servings ${recipe.servingCount}->${updateData.servingCount}`);
      if (updateData.averageCalories !== undefined) summary.push(`kcal ${recipe.averageCalories}->${updateData.averageCalories}`);
      if (updateData.protein !== undefined) summary.push(`P ${recipe.protein}->${updateData.protein}`);
      if (updateData.carbs !== undefined) summary.push(`C ${recipe.carbs}->${updateData.carbs}`);
      if (updateData.fat !== undefined) summary.push(`F ${recipe.fat}->${updateData.fat}`);
      if (tagsChanged) summary.push(`tags ±${tagsAdd.length + tagsRemove.length}`);
      if (allergensChanged) summary.push(`allergens ±${allergensAdd.length + allergensRemove.length}`);
      if (ingsAdd.length > 0) summary.push(`+${ingsAdd.length} ing`);
      if (ingsRemove.length > 0) summary.push(`-${ingsRemove.length} ing`);
      if (ingsAmountChange.length > 0) summary.push(`~${ingsAmountChange.length} ing-amount`);
      if (stepsReplace.length > 0) summary.push(`~${stepsReplace.length} step`);
      console.log(`DRY ${e.slug} | ${summary.join(", ")}`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      // Recipe field updates
      if (Object.keys(updateData).length > 0) {
        await tx.recipe.update({ where: { id: recipe.id }, data: updateData });
      }

      // Tags relation update (RecipeTag join table)
      if (tagsChanged) {
        // Eklenecek tag'lerin Tag tablosundaki id'lerini bul (slug match)
        const slugsToAdd = tagsAdd.filter((s) => !currentTagSlugs.has(s));
        if (slugsToAdd.length > 0) {
          const tagRows = await tx.tag.findMany({
            where: { slug: { in: slugsToAdd } },
            select: { id: true, slug: true },
          });
          for (const tagRow of tagRows) {
            await tx.recipeTag.create({
              data: { recipeId: recipe.id, tagId: tagRow.id },
            });
          }
        }
        // Silinecek tag'ler: RecipeTag rows ile join
        const slugsToRemove = tagsRemove.filter((s) => currentTagSlugs.has(s));
        if (slugsToRemove.length > 0) {
          await tx.recipeTag.deleteMany({
            where: {
              recipeId: recipe.id,
              tag: { slug: { in: slugsToRemove } },
            },
          });
        }
      }

      // Ingredient remove (case-insensitive name match)
      for (const removeName of ingsRemove) {
        const target = recipe.ingredients.find(
          (i) => i.name.toLocaleLowerCase("tr") === removeName.toLocaleLowerCase("tr"),
        );
        if (target) {
          await tx.recipeIngredient.delete({ where: { id: target.id } });
        }
      }

      // Ingredient add (sortOrder = mevcut max + 1, 2, ...)
      const maxSort = recipe.ingredients.reduce((m, i) => Math.max(m, i.sortOrder), 0);
      const existingNames = new Set(recipe.ingredients.map((i) => i.name.toLocaleLowerCase("tr")));
      for (const [idx, ing] of ingsAdd.entries()) {
        if (existingNames.has(ing.name.toLocaleLowerCase("tr"))) continue;
        await tx.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            sortOrder: maxSort + 1 + idx,
            group: ing.group ?? null,
          },
        });
      }

      // Ingredient amount/unit change (case-insensitive name match)
      for (const ac of ingsAmountChange) {
        const target = recipe.ingredients.find(
          (i) => i.name.toLocaleLowerCase("tr") === ac.name.toLocaleLowerCase("tr"),
        );
        if (target) {
          await tx.recipeIngredient.update({
            where: { id: target.id },
            data: {
              amount: ac.newAmount,
              ...(ac.newUnit !== undefined ? { unit: ac.newUnit } : {}),
            },
          });
        }
      }

      // Step replace (find by stepNumber + recipeId, update instruction)
      for (const sr of stepsReplace) {
        const existing = await tx.recipeStep.findFirst({
          where: { recipeId: recipe.id, stepNumber: sr.stepNumber },
          select: { id: true },
        });
        if (existing) {
          await tx.recipeStep.update({
            where: { id: existing.id },
            data: {
              instruction: sr.instruction,
              ...(sr.timerSeconds !== undefined ? { timerSeconds: sr.timerSeconds } : {}),
            },
          });
        }
      }

      // AuditLog
      await tx.auditLog.create({
        data: {
          action: "MOD_K_APPLY",
          targetType: "recipe",
          targetId: recipe.id,
          metadata: {
            slug: e.slug,
            verdict: e.verdict,
            issues: e.issues ?? [],
            corrections_applied: {
              description: !!updateData.description,
              cuisine: !!updateData.cuisine,
              tipNote: !!updateData.tipNote,
              servingSuggestion: !!updateData.servingSuggestion,
              times: !!(updateData.prepMinutes || updateData.cookMinutes || updateData.totalMinutes),
              servingCount: !!updateData.servingCount,
              macros: !!(updateData.averageCalories || updateData.protein || updateData.carbs || updateData.fat),
              tags_changed: tagsChanged,
              allergens_changed: allergensChanged,
              ingredients_added: ingsAdd.length,
              ingredients_removed: ingsRemove.length,
              ingredients_amount_changed: ingsAmountChange.length,
              steps_replaced: stepsReplace.length,
            },
            sources: e.sources ?? [],
            confidence: e.confidence ?? null,
            reason: e.reason ?? null,
          },
        },
      });
    });
    updated++;
    console.log(`OK ${e.slug} (${e.verdict})`);
  }

  console.log("");
  console.log(`Summary: ${updated} updated, ${skipped} idempotent, ${notFound} not_found`);
  if (!APPLY) console.log(`Dry-run. --apply ile DB'ye yaz.`);

  // K7 P2 #3 (oturum 26 test campaign) hatirlatma: Mod K v2 ingredient
  // degisiklikleri sonrasi nutrition macro alanlari (averageCalories,
  // protein, carbs, fat) eskimis kalir. Recompute pipeline ayri kosulur.
  // audit-nutrition-anomaly script bu drift'i raporlar (oturum 26'da
  // 1162 -> 1181 anomali). Mod K v2 71 sub-batch tamamlanmasinin sonunda
  // veya ara araliklarda compute-recipe-nutrition koşulmali.
  if (APPLY && updated > 0) {
    console.log("");
    console.log(`⚠️  Nutrition macro recompute hatirlatmasi:`);
    console.log(`   Bu batch'te ingredient degisikligi olabilir. Macro fields`);
    console.log(`   (averageCalories/protein/carbs/fat) eski kalir.`);
    console.log(`   Onerilen: 'npx tsx scripts/compute-recipe-nutrition.ts'`);
    console.log(`   Audit: 'npx tsx scripts/audit-nutrition-anomaly.ts'`);
  }

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
