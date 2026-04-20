/**
 * Duplicate title winner/loser analizi, P2 iş paketi (read-only).
 *
 * Her duplicate title grubu için:
 *   - Winner: en çok ingredient + en uzun desc + isFeatured + viewCount
 *   - Loser: grup içindeki diğerleri
 *   - Bookmark + CollectionItem + MealPlanItem + Variation + Review referans
 *     sayıları (merge sırasında migrate edilecek satırlar)
 *
 * Çıktı:
 *   1. Konsol tablo (özet)
 *   2. docs/duplicate-title-plan-2026-04-20.csv (merge script input)
 *
 * Çalıştırma:
 *   npx tsx scripts/audit-duplicate-winner.ts             # dev
 *   export DATABASE_URL=<prod> && npx tsx scripts/audit-duplicate-winner.ts  # prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { detectDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface CandidateRecipe {
  id: string;
  slug: string;
  title: string;
  cuisine: string | null;
  description: string;
  totalMinutes: number;
  isFeatured: boolean;
  viewCount: number;
  ingredientCount: number;
  stepCount: number;
  bookmarkCount: number;
  collectionItemCount: number;
  mealPlanItemCount: number;
  variationCount: number;
  reviewCount: number;
  viewDailyRows: number;
}

function score(r: CandidateRecipe): number {
  // Higher = better winner candidate. Weights:
  //   isFeatured dominant (1000), ingredient/step count moderate (10x/5x),
  //   description length mild (×0.1), viewCount slight (×0.01),
  //   slug length favoring kısa slug (negatif).
  return (
    (r.isFeatured ? 1000 : 0) +
    r.ingredientCount * 10 +
    r.stepCount * 5 +
    r.description.length * 0.1 +
    r.viewCount * 0.01 -
    r.slug.length * 0.1
  );
}

async function main(): Promise<void> {
  const target = detectDbTarget(process.env.DATABASE_URL);
  console.log(`Duplicate title winner analizi, branch: ${target.branch}\n`);

  // Case-insensitive duplicate title grupları
  const dups: Array<{ title_lower: string; count: bigint; slugs: string[] }> = await prisma.$queryRaw`
    SELECT LOWER(title) AS title_lower, COUNT(*) AS count, ARRAY_AGG(slug ORDER BY slug) AS slugs
    FROM recipes
    GROUP BY LOWER(title)
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, LOWER(title)
  `;
  console.log(`Total duplicate groups: ${dups.length}\n`);

  const csvRows: string[] = [
    "title_lower,group_size,winner_slug,winner_score,loser_slugs,total_bookmark_loser,total_coll_loser,total_mealplan_loser,total_variation_loser,total_review_loser,cuisine_group",
  ];

  let totalLoserRows = 0;
  let totalLoserRefsToMigrate = 0;
  const shownSamples: string[] = [];

  for (const d of dups) {
    const recipes = await prisma.recipe.findMany({
      where: { slug: { in: d.slugs } },
      select: {
        id: true,
        slug: true,
        title: true,
        cuisine: true,
        description: true,
        totalMinutes: true,
        isFeatured: true,
        viewCount: true,
        _count: {
          select: {
            ingredients: true,
            steps: true,
            bookmarks: true,
            collectionItems: true,
            mealPlanItems: true,
            variations: true,
            reviews: true,
            viewDaily: true,
          },
        },
      },
    });

    const candidates: CandidateRecipe[] = recipes.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      cuisine: r.cuisine,
      description: r.description,
      totalMinutes: r.totalMinutes,
      isFeatured: r.isFeatured,
      viewCount: r.viewCount,
      ingredientCount: r._count.ingredients,
      stepCount: r._count.steps,
      bookmarkCount: r._count.bookmarks,
      collectionItemCount: r._count.collectionItems,
      mealPlanItemCount: r._count.mealPlanItems,
      variationCount: r._count.variations,
      reviewCount: r._count.reviews,
      viewDailyRows: r._count.viewDaily,
    }));

    candidates.sort((a, b) => score(b) - score(a));
    const [winner, ...losers] = candidates;

    const cuisines = new Set(candidates.map((c) => c.cuisine ?? "NULL"));
    const cuisineGroup = cuisines.size === 1 ? "same" : "mixed";

    const totalBookmarkLoser = losers.reduce((acc, r) => acc + r.bookmarkCount, 0);
    const totalCollLoser = losers.reduce((acc, r) => acc + r.collectionItemCount, 0);
    const totalMealLoser = losers.reduce((acc, r) => acc + r.mealPlanItemCount, 0);
    const totalVarLoser = losers.reduce((acc, r) => acc + r.variationCount, 0);
    const totalRevLoser = losers.reduce((acc, r) => acc + r.reviewCount, 0);

    totalLoserRows += losers.length;
    totalLoserRefsToMigrate +=
      totalBookmarkLoser + totalCollLoser + totalMealLoser + totalVarLoser + totalRevLoser;

    csvRows.push(
      [
        `"${d.title_lower.replace(/"/g, '""')}"`,
        String(Number(d.count)),
        winner.slug,
        score(winner).toFixed(1),
        `"${losers.map((l) => l.slug).join("|")}"`,
        String(totalBookmarkLoser),
        String(totalCollLoser),
        String(totalMealLoser),
        String(totalVarLoser),
        String(totalRevLoser),
        cuisineGroup,
      ].join(","),
    );

    if (shownSamples.length < 10) {
      shownSamples.push(
        `  "${d.title_lower}" × ${Number(d.count)} (${cuisineGroup})\n` +
          `    ✓ winner: ${winner.slug} (score ${score(winner).toFixed(1)}, ing ${winner.ingredientCount}, step ${winner.stepCount}, featured ${winner.isFeatured})\n` +
          losers
            .map(
              (l) =>
                `    ✗ loser:  ${l.slug} (score ${score(l).toFixed(1)}, ing ${l.ingredientCount}, step ${l.stepCount}, refs bm=${l.bookmarkCount} coll=${l.collectionItemCount} var=${l.variationCount})`,
            )
            .join("\n"),
      );
    }
  }

  // İlk 10 örnek
  console.log("First 10 sample groups (winner vs loser):\n");
  for (const s of shownSamples) console.log(s);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Duplicate groups:              ${dups.length}`);
  console.log(`  Total loser rows (merge cand): ${totalLoserRows}`);
  console.log(`  Total loser refs to migrate:   ${totalLoserRefsToMigrate}`);
  console.log(`    (Bookmark + CollectionItem + MealPlanItem + Variation + Review)`);

  // CSV yaz
  const csvPath = path.resolve(__d, "..", "docs", "duplicate-title-plan-2026-04-20.csv");
  fs.writeFileSync(csvPath, csvRows.join("\n"), "utf8");
  console.log(`\n  CSV written: ${csvPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
