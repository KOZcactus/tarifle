/**
 * Remove tags that contradict recipe data, surfaced by audit-deep.ts
 * RECIPE_CONSISTENCY warnings:
 *
 * - "30-dakika-alti" tag with totalMinutes > 30 → remove tag
 * - "yuksek-protein" tag with protein < 15g → remove tag
 *
 * Idempotent, re-running after a successful apply is a no-op.
 * Default dry run, `--apply` to write.
 *
 *   npx tsx scripts/fix-inconsistent-tags.ts              # dry run
 *   npx tsx scripts/fix-inconsistent-tags.ts --apply      # write
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const QUICK_THRESHOLD = 30; // minutes, "30-dakika-alti"
const PROTEIN_THRESHOLD = 15; // grams, "yuksek-protein"

async function main(): Promise<void> {
  assertDbTarget("fix-inconsistent-tags");
  console.log(
    `🔧 fix-inconsistent-tags (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const tags = await prisma.tag.findMany({
    where: { slug: { in: ["30-dakika-alti", "yuksek-protein"] } },
    select: { id: true, slug: true },
  });
  const tagId = new Map(tags.map((t) => [t.slug, t.id]));
  const quickId = tagId.get("30-dakika-alti");
  const proteinId = tagId.get("yuksek-protein");
  if (!quickId || !proteinId) {
    console.error("❌ Expected tags missing from Tag table");
    process.exit(1);
  }

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      totalMinutes: true,
      protein: true,
      tags: { select: { tagId: true } },
    },
  });

  const quickRemovals: { recipeId: string; slug: string; total: number }[] = [];
  const proteinRemovals: { recipeId: string; slug: string; protein: number }[] = [];

  const skippedLastTag: string[] = [];
  for (const r of recipes) {
    const tagIds = new Set(r.tags.map((t) => t.tagId));
    if (tagIds.has(quickId) && r.totalMinutes > QUICK_THRESHOLD) {
      // Don't leave the recipe with 0 tags, skip if quick tag is the only one
      if (r.tags.length === 1) {
        skippedLastTag.push(`${r.slug} (would lose "30-dakika-alti" as only tag)`);
      } else {
        quickRemovals.push({ recipeId: r.id, slug: r.slug, total: r.totalMinutes });
      }
    }
    if (
      tagIds.has(proteinId) &&
      r.protein !== null &&
      Number(r.protein) < PROTEIN_THRESHOLD
    ) {
      if (r.tags.length === 1) {
        skippedLastTag.push(`${r.slug} (would lose "yuksek-protein" as only tag)`);
      } else {
        proteinRemovals.push({
          recipeId: r.id,
          slug: r.slug,
          protein: Number(r.protein),
        });
      }
    }
  }

  if (skippedLastTag.length > 0) {
    console.log(
      `⚠️  Skipped ${skippedLastTag.length} recipe(s) to avoid leaving 0 tags:`,
    );
    for (const s of skippedLastTag) console.log(`   ${s}`);
    console.log("");
  }

  console.log(`--- 30-dakika-alti removals (${quickRemovals.length}) ---`);
  for (const q of quickRemovals) {
    console.log(`  ${q.slug.padEnd(36)} totalMinutes=${q.total}`);
  }
  console.log(`\n--- yuksek-protein removals (${proteinRemovals.length}) ---`);
  for (const p of proteinRemovals) {
    console.log(`  ${p.slug.padEnd(36)} protein=${p.protein}g`);
  }

  if (APPLY) {
    if (quickRemovals.length > 0) {
      await prisma.recipeTag.deleteMany({
        where: {
          tagId: quickId,
          recipeId: { in: quickRemovals.map((q) => q.recipeId) },
        },
      });
    }
    if (proteinRemovals.length > 0) {
      await prisma.recipeTag.deleteMany({
        where: {
          tagId: proteinId,
          recipeId: { in: proteinRemovals.map((p) => p.recipeId) },
        },
      });
    }
  }

  const total = quickRemovals.length + proteinRemovals.length;
  const verb = APPLY ? "Removed" : "Would remove";
  console.log(`\n${verb}: ${total} tag link(s)`);
  if (!APPLY) console.log("(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
