/**
 * Remove `group` label from ingredients that are the sole member of their
 * group. A bucket header for a single ingredient adds noise without
 * meaningful structure — the ingredient itself stays, only the header
 * disappears (UI falls back to flat list when that ingredient has no group).
 *
 * Idempotent — re-running after apply is a no-op.
 *
 *   npx tsx scripts/fix-single-ingredient-groups.ts              # dry run
 *   npx tsx scripts/fix-single-ingredient-groups.ts --apply      # write
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

async function main(): Promise<void> {
  assertDbTarget("fix-single-ingredient-groups");
  console.log(
    `🔧 fix-single-ingredient-groups (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      ingredients: {
        select: { id: true, name: true, group: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const idsToNull: { id: string; slug: string; name: string; group: string }[] = [];

  for (const r of recipes) {
    // Count ingredients per group (null groups excluded)
    const groupCounts = new Map<string, number>();
    for (const ing of r.ingredients) {
      if (ing.group) {
        groupCounts.set(ing.group, (groupCounts.get(ing.group) ?? 0) + 1);
      }
    }
    // Find singleton groups
    const singletonGroups = new Set<string>();
    for (const [group, count] of groupCounts) {
      if (count === 1) singletonGroups.add(group);
    }
    if (singletonGroups.size === 0) continue;

    // Flag those ingredients for group=null
    for (const ing of r.ingredients) {
      if (ing.group && singletonGroups.has(ing.group)) {
        idsToNull.push({
          id: ing.id,
          slug: r.slug,
          name: ing.name,
          group: ing.group,
        });
      }
    }
  }

  const byRecipe = new Map<string, typeof idsToNull>();
  for (const item of idsToNull) {
    const arr = byRecipe.get(item.slug) ?? [];
    arr.push(item);
    byRecipe.set(item.slug, arr);
  }

  console.log(
    `--- ${byRecipe.size} recipe(s), ${idsToNull.length} ingredient(s) to null ---\n`,
  );
  for (const [slug, items] of byRecipe) {
    for (const it of items) {
      console.log(
        `  ${slug.padEnd(28)} "${it.name}" — "${it.group}" → null`,
      );
    }
  }

  if (APPLY && idsToNull.length > 0) {
    await prisma.recipeIngredient.updateMany({
      where: { id: { in: idsToNull.map((i) => i.id) } },
      data: { group: null },
    });
    console.log(`\n✅ Nulled ${idsToNull.length} ingredient group(s)`);
  } else if (!APPLY) {
    console.log(`\n(dry run — re-run with --apply to write)`);
  }
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
