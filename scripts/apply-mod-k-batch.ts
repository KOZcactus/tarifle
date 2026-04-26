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
    ingredients_add?: Array<{ name: string; amount: string; unit: string; group?: string }>;
    ingredients_remove?: string[];
    steps_replace?: Array<{ stepNumber: number; instruction: string; timerSeconds?: number | null }>;
    tipNote?: string;
    prepMinutes?: number;
    cookMinutes?: number;
    totalMinutes?: number;
  };
  sources?: string[];
  confidence?: "high" | "medium" | "low";
  reason?: string;
}

function parseBatchArg(): number[] | null {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1]
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseSlugsArg(): Set<string> | null {
  const idx = process.argv.indexOf("--slugs");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return new Set(process.argv[idx + 1].split(",").map((s) => s.trim()).filter(Boolean));
}

function discoverBatchFiles(filter: number[] | null): string[] {
  const docsDir = path.resolve(process.cwd(), "docs");
  const all = fs
    .readdirSync(docsDir)
    .filter((f) => /^mod-k-batch-\d+\.json$/.test(f))
    .sort();
  if (!filter) return all.map((f) => path.join(docsDir, f));
  const set = new Set(filter);
  return all
    .filter((f) => {
      const m = f.match(/^mod-k-batch-(\d+)\.json$/);
      return m && set.has(Number.parseInt(m[1], 10));
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
        tipNote: true,
        prepMinutes: true,
        cookMinutes: true,
        totalMinutes: true,
        status: true,
        ingredients: { select: { id: true, name: true, sortOrder: true } },
      },
    });
    if (!recipe || recipe.status !== "PUBLISHED") {
      console.log(`NOT_FOUND_OR_STATUS ${e.slug}`);
      notFound++;
      continue;
    }

    const c = e.corrections!;
    const updateData: {
      description?: string;
      tipNote?: string | null;
      prepMinutes?: number;
      cookMinutes?: number;
      totalMinutes?: number;
    } = {};

    let hasChange = false;
    if (c.description && c.description !== recipe.description) {
      updateData.description = c.description;
      hasChange = true;
    }
    if (c.tipNote && c.tipNote !== recipe.tipNote) {
      updateData.tipNote = c.tipNote;
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

    const ingsAdd = c.ingredients_add ?? [];
    const ingsRemove = c.ingredients_remove ?? [];
    const stepsReplace = c.steps_replace ?? [];

    if (!hasChange && ingsAdd.length === 0 && ingsRemove.length === 0 && stepsReplace.length === 0) {
      console.log(`SKIP ${e.slug} (zaten guncel)`);
      skipped++;
      continue;
    }

    if (!APPLY) {
      const summary: string[] = [];
      if (updateData.description) summary.push("description");
      if (updateData.tipNote) summary.push("tipNote");
      if (updateData.prepMinutes !== undefined) summary.push(`prep ${recipe.prepMinutes}->${updateData.prepMinutes}`);
      if (updateData.cookMinutes !== undefined) summary.push(`cook ${recipe.cookMinutes}->${updateData.cookMinutes}`);
      if (updateData.totalMinutes !== undefined) summary.push(`total ${recipe.totalMinutes}->${updateData.totalMinutes}`);
      if (ingsAdd.length > 0) summary.push(`+${ingsAdd.length} ing`);
      if (ingsRemove.length > 0) summary.push(`-${ingsRemove.length} ing`);
      if (stepsReplace.length > 0) summary.push(`~${stepsReplace.length} step`);
      console.log(`DRY ${e.slug} | ${summary.join(", ")}`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      // Recipe field updates
      if (Object.keys(updateData).length > 0) {
        await tx.recipe.update({ where: { id: recipe.id }, data: updateData });
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
              tipNote: !!updateData.tipNote,
              times: !!(updateData.prepMinutes || updateData.cookMinutes || updateData.totalMinutes),
              ingredients_added: ingsAdd.length,
              ingredients_removed: ingsRemove.length,
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
