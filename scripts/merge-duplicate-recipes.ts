/**
 * Duplicate title merge, `docs/duplicate-title-plan-YYYY-MM-DD.csv`
 * plan dosyasını okur, her grupta winner'ı tutup loser'ları siler.
 *
 * Safety:
 *   - Default dry-run, --apply ile DB'ye yazar
 *   - Prod'da --confirm-prod zorunlu (db-env guard)
 *   - Her loser silinmeden önce Bookmark + CollectionItem + MealPlanItem
 *     + Variation + Review referansları winner'a migrate edilir
 *     (ON CONFLICT DO NOTHING için composite unique'te)
 *   - Loser Recipe.delete cascade sayesinde RecipeIngredient + RecipeStep
 *     + RecipeTag + RecipeViewDaily + RecipePhoto siler
 *
 * Usage:
 *   # Dev dry-run
 *   npx tsx scripts/merge-duplicate-recipes.ts
 *
 *   # Dev apply
 *   npx tsx scripts/merge-duplicate-recipes.ts --apply
 *
 *   # Prod apply (explicit)
 *   DATABASE_URL=<prod> npx tsx scripts/merge-duplicate-recipes.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const CSV_PATH = path.resolve(
  __d,
  "..",
  "docs",
  "duplicate-title-plan-2026-04-20.csv",
);

interface PlanRow {
  titleLower: string;
  winnerSlug: string;
  loserSlugs: string[];
  cuisineGroup: "same" | "mixed";
}

function parseCsv(): PlanRow[] {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const lines = raw.trim().split("\n").slice(1);
  const rows: PlanRow[] = [];
  for (const line of lines) {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else current += ch;
    }
    fields.push(current);
    const [titleLower, , winnerSlug, , loserSlugsRaw, , , , , , cuisineGroup] = fields;
    if (!winnerSlug || !loserSlugsRaw) continue;
    rows.push({
      titleLower: titleLower.replace(/^"|"$/g, ""),
      winnerSlug,
      loserSlugs: loserSlugsRaw.replace(/^"|"$/g, "").split("|").filter(Boolean),
      cuisineGroup: (cuisineGroup as "same" | "mixed") ?? "same",
    });
  }
  return rows;
}

async function migrateReferences(winnerId: string, loserId: string): Promise<{
  bookmarks: number;
  collectionItems: number;
  mealPlanItems: number;
  variations: number;
  reviews: number;
}> {
  // Bookmark: @@unique([userId, recipeId]) → ON CONFLICT DO NOTHING
  const bookmarksResult = await prisma.$executeRaw`
    INSERT INTO bookmarks ("id", "userId", "recipeId", "createdAt")
    SELECT id, "userId", ${winnerId}, "createdAt"
    FROM bookmarks WHERE "recipeId" = ${loserId}
    ON CONFLICT ("userId", "recipeId") DO NOTHING
  `;

  // CollectionItem: @@unique([collectionId, recipeId])
  const collResult = await prisma.$executeRaw`
    INSERT INTO collection_items ("id", "collectionId", "recipeId", "note", "addedAt")
    SELECT id, "collectionId", ${winnerId}, note, "addedAt"
    FROM collection_items WHERE "recipeId" = ${loserId}
    ON CONFLICT ("collectionId", "recipeId") DO NOTHING
  `;

  // MealPlanItem: @@unique([mealPlanId, dayOfWeek, mealType])
  const mealResult = await prisma.$executeRaw`
    INSERT INTO meal_plan_items ("id", "mealPlanId", "recipeId", "dayOfWeek", "mealType", servings, "createdAt")
    SELECT id, "mealPlanId", ${winnerId}, "dayOfWeek", "mealType", servings, "createdAt"
    FROM meal_plan_items WHERE "recipeId" = ${loserId}
    ON CONFLICT ("mealPlanId", "dayOfWeek", "mealType") DO NOTHING
  `;

  // Variation: no composite unique on (recipeId, authorId, miniTitle), so just
  // reassign recipeId, keeps all. Authors keep their variations on winner.
  const varResult = await prisma.$executeRaw`
    UPDATE variations SET "recipeId" = ${winnerId} WHERE "recipeId" = ${loserId}
  `;

  // Review: @@unique([userId, recipeId]) → ON CONFLICT DO NOTHING
  // Note: Review üç kolonlu unique olmadığından önce NOT EXISTS check et,
  // Prisma raw'da ON CONFLICT DO NOTHING + SELECT ile dup'ları filtrele.
  const revResult = await prisma.$executeRaw`
    UPDATE reviews SET "recipeId" = ${winnerId}
    WHERE "recipeId" = ${loserId}
      AND NOT EXISTS (
        SELECT 1 FROM reviews r2
        WHERE r2."recipeId" = ${winnerId} AND r2."userId" = reviews."userId"
      )
  `;

  return {
    bookmarks: Number(bookmarksResult),
    collectionItems: Number(collResult),
    mealPlanItems: Number(mealResult),
    variations: Number(varResult),
    reviews: Number(revResult),
  };
}

async function main(): Promise<void> {
  if (APPLY) assertDbTarget("merge-duplicate-recipes");

  const plan = parseCsv();
  console.log(`📋 ${plan.length} duplicate group, dry-run=${!APPLY}\n`);

  let groupsProcessed = 0;
  let losersDeleted = 0;
  const totalRefsMigrated = { b: 0, c: 0, m: 0, v: 0, r: 0 };
  const notFoundLosers: string[] = [];

  for (const p of plan) {
    const winner = await prisma.recipe.findUnique({
      where: { slug: p.winnerSlug },
      select: { id: true, slug: true },
    });
    if (!winner) {
      console.log(`  ⚠️  winner not in DB: ${p.winnerSlug}, atlanıyor`);
      continue;
    }

    const losers = await prisma.recipe.findMany({
      where: { slug: { in: p.loserSlugs } },
      select: { id: true, slug: true },
    });

    for (const exp of p.loserSlugs) {
      if (!losers.find((l) => l.slug === exp)) notFoundLosers.push(exp);
    }

    for (const loser of losers) {
      if (APPLY) {
        const refs = await migrateReferences(winner.id, loser.id);
        totalRefsMigrated.b += refs.bookmarks;
        totalRefsMigrated.c += refs.collectionItems;
        totalRefsMigrated.m += refs.mealPlanItems;
        totalRefsMigrated.v += refs.variations;
        totalRefsMigrated.r += refs.reviews;
        await prisma.recipe.delete({ where: { id: loser.id } });
      }
      losersDeleted++;
    }

    groupsProcessed++;
  }

  console.log(`\n📊 SUMMARY`);
  console.log(`  Groups processed:   ${groupsProcessed}`);
  console.log(`  Losers deleted:     ${losersDeleted}`);
  console.log(`  Not-found losers:   ${notFoundLosers.length}`);
  if (APPLY) {
    console.log(`  Refs migrated:`);
    console.log(`    Bookmarks:        ${totalRefsMigrated.b}`);
    console.log(`    CollectionItems:  ${totalRefsMigrated.c}`);
    console.log(`    MealPlanItems:    ${totalRefsMigrated.m}`);
    console.log(`    Variations:       ${totalRefsMigrated.v}`);
    console.log(`    Reviews:          ${totalRefsMigrated.r}`);
  }
  if (notFoundLosers.length > 0 && notFoundLosers.length <= 20) {
    console.log(`\n  First not-found losers:\n    ${notFoundLosers.slice(0, 10).join("\n    ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
